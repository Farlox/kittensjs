import { Game, Price, Button, Tab, gamePage } from "./game";
import { Planner } from "./exp";

// Kitten Kai
class Action {
  private tabName: string;
  private button: any;

  get name(): string {
    return this.button.model.metadata.name;
  }
  get model(): any {
    return this.button.model;
  }

  private _gap: Price[] = null;
  private _time: number = null;

  constructor(tabName: string, button: Button) {
    this.tabName = tabName;
    this.button = button;
  }

  public click(): boolean {
    Game.pushTab(this.tabName);

    let wasEnabled = this.model.enabled;

    if (wasEnabled) {
      this.button.buttonContent.click();
      console.log("KAI: " + this.tabName + ": " + this.name);
    }

    Game.popTab();

    return wasEnabled;
  }

  get gap() {
    if (this._gap == null) {
      this._gap = [];

      for (let price of this.model.prices) {
        let res = Game.getResource(price.name);
        if (res.value < price.val) {
          this._gap.push({
            name: price.name,
            val: price.val - res.value
          });
        }
      }
    }

    return this._gap;
  }

  get time() {
    if (this._time == null) {
      this._time = 0;
      var rawGap = Planner.convertToRaw(this.gap);
      for (let gap of rawGap) {
        if (Game.getResourcePerTick(gap.name) < 0) {
          this._time = Infinity;
          break;
        }

        this._time += gap.val / (Game.getResourcePerTick(gap.name) * 5);
      }
    }

    return this._time;
  }
}

export class Need implements Price {
  name: string;
  val: number;
  weight: number;
}

class Kai {
  public intervalId: number = undefined;
  public needs: Need[] = [];

  public stop() {
    if (this.intervalId != undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log("stopped.");
    }
  }

  public tick() {
    console.log("KAI: tick");
    let catnipProd = Game.getResourcePerTick("catnip");

    // 0. Affordable Workshop, Science, Religion
    for (let upgrade of this.enumerateAffordableActions(
      Game.WorkshopTab,
      "Workshop"
    )) {
      if (upgrade.click()) break;
    }

    for (let research of this.enumerateAffordableActions(
      Game.ScienceTab,
      "Science"
    )) {
      if (research.click()) break;
    }

    // TODO: Religion

    // 1. Build things
    for (let bld of this.enumerateAffordableActions(
      Game.BonfireTab,
      "Bonfire"
    )) {
      if (this.prereqs[bld.name] === undefined || this.prereqs[bld.name]()) {
        if (bld.click()) break;
      }
    }

    // 2. Build space things
    this.buildSpace();

    // 3: determine needs for the next items
    this.needs = Planner.CalcNeeds();

    // 4: craft resources that are at capped
    for (let craft of this.craftOrder) {
      if (this.isFull(craft.raw) && Game.getResource(craft.refined).craftable) {
        // amount acquired in 20 seconds
        let seconds = 20;
        let rawAmount =
          seconds *
          Game.const.ticksPerSecond *
          Game.getResourcePerTick(craft.raw);
        let refinedAmount = rawAmount / craft.ratio;
        if (refinedAmount <= 0) continue;
        Game.craft(craft.refined, refinedAmount);
        console.log("KAI: crafted " + refinedAmount + " " + craft.refined);
      }
    }
    // TODO: beam to scaffold if needed
    let beam = Game.getResource("beam");
    let scaffold = Game.getResource("scaffold");
    if (
      scaffold.unlocked &&
      beam.value >= Game.const.beamPerScaffold &&
      scaffold.value < 0.1 * beam.value
    ) {
      let amount = Math.max(
        1,
        (0.01 * beam.value) / Game.const.beamPerScaffold
      );
      console.log("KAI: crafted " + amount + " scaffold");
      Game.craft("scaffold", amount);
    }
    if (this.isFull("coal")) {
    }

    if (this.isFull("iron")) {
    }

    // TODO: trade/explore

    // TODO: balance jobs

    // X. ensure food production is positive
    if (catnipProd < 0 && !Game.isWinter()) {
      if (Game.freeKittens == 0) {
        // unassign from some job
      }
      //Game.assignJob(Game.getJob('farmer'));
    }
  }

  public buildSpace() {
    if (Game.SpaceTab.visible) {
      for (let planet of Game.SpaceTab.planetPanels) {
        for (let btn of planet.children) {
          if (
            btn.model.visible &&
            btn.model.metadata !== undefined &&
            btn.model.metadata.unlocked &&
            Planner.canAfford(btn.model.prices)
          ) {
            new Action("Space", btn).click();
          }
        }
      }
    }
  }

  private enumerateAffordableActions(tab: Tab, tabLabel: string): Action[] {
    let actions: Action[] = [];

    if (tab.visible) {
      for (let btn of tab.buttons) {
        if (
          btn.model.visible &&
          btn.model.metadata !== undefined &&
          btn.model.metadata.unlocked &&
          !btn.model.metadata.researched &&
          Planner.canAfford(btn.model.prices)
        ) {
          actions.push(new Action(tabLabel, btn));
        }
      }
    }

    return actions;
  }

  private isFull(resourceName: string): boolean {
    let res = Game.getResource(resourceName);
    return res.value >= res.maxValue * 0.95;
  }

  prereqs = {
    field: function() {
      return Game.isSpringSummer();
    },
    pasture: function() {
      return Game.isSpringSummer();
    },
    steamworks: function() {
      return Game.NetEnergy < 2;
    },
    oilWell: function() {
      return !gamePage.workshop.get("pumpjack").unlocked || Game.NetEnergy > 0;
    },
    //smelter: function() { return k.needs.iron > 0; },
    warehouse: function() {
      let w = gamePage.bld.getPrices("warehouse");
      return (
        Game.getResource(w[0].name).value * 0.1 > w[0].val &&
        Game.getResource(w[1].name).value * 0.1 > w[1].val
      );
    },
    harbor: function() {
      var h = gamePage.bld.getPrices("harbor");
      return (
        Game.getResource(h[0].name).value * 0.1 > h[0].val &&
        Game.getResource(h[1].name).value * 0.1 > h[1].val &&
        Game.getResource(h[2].name).value * 0.1 > h[2].val
      );
    },
    calciner: function() {
      return Game.getResourcePerTick("oil") > 0.05 && Game.NetEnergy > 0;
    },
    magneto: function() {
      return Game.getResourcePerTick("oil") > 0.05;
    },
    reactor: function() {
      return Game.getResourcePerTick("uranium") >= 0.001;
    },
    ziggurat: function() {
      return gamePage.bld.get("ziggurat").val < 1;
    },
    factory: function() {
      return false;
    },
    mint: function() {
      Game.getResourcePerTick("furs") < 0 ||
        Game.getResourcePerTick("ivory") < 0;
    }
  };

  craftOrder = [
    { raw: "wood", refined: "beam", ratio: 175 },
    { raw: "catnip", refined: "wood", ratio: 100 },
    { raw: "wood", refined: "beam", ratio: 175 },
    { raw: "minerals", refined: "slab", ratio: 250 },
    { raw: "coal", refined: "steel", ratio: 100 },
    { raw: "iron", refined: "plate", ratio: 125 },
    { raw: "titanium", refined: "alloy", ratio: 10 },
    { raw: "oil", refined: "kerosene", ratio: 7500 },
    { raw: "uranium", refined: "thorium", ratio: 250 }
  ];

  // lists actions within capacity
  public enumerateActionsWithinCapacity(): Action[] {
    let actions = new Array<Action>();

    // buildings
    for (let b of Game.BonfireTab.buttons) {
      if (b.model.metadata !== undefined) {
        var model = b.model;
        var name = model.metadata.name;

        if (
          (this.prereqs[name] === undefined || this.prereqs[name]()) &&
          Planner.haveCapacity(model.prices)
        ) {
          actions.push(new Action("Bonfire", b));
        }
      }
    }

    // workshop upgrades
    if (Game.WorkshopTab.visible) {
      for (let btn of Game.WorkshopTab.buttons) {
        if (
          btn.model.visible &&
          btn.model.metadata.unlocked &&
          !btn.model.metadata.researched &&
          Planner.haveCapacity(btn.model.prices)
        ) {
          actions.push(new Action("Workshop", btn));
        }
      }
    }

    // science research
    if (Game.ScienceTab.visible) {
      for (let btn of Game.ScienceTab.buttons) {
        if (
          btn.model.visible &&
          btn.model.metadata.unlocked &&
          !btn.model.metadata.researched &&
          Planner.haveCapacity(btn.model.prices)
        ) {
          actions.push(new Action("Science", btn));
        }
      }
    }

    return actions;
  }
}

if (a != undefined) a.stop();
var a = new Kai();
a.intervalId = setInterval(function() {
  a.buildSpace();
}, 5000);
console.log("KAI: started.");
