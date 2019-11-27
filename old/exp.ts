import { gamePage, Price, Game } from "./game";
import { Need } from "./kai";

class State {
  catnipPerTick: number;
  isSpringSummer: boolean;
  isWinter: boolean;

  prereq?;

  public satisfies(requiredState: State): boolean {
    if (
      requiredState.catnipPerTick !== undefined &&
      this.catnipPerTick < requiredState.catnipPerTick
    )
      return false;

    if (
      requiredState.isSpringSummer !== undefined &&
      this.isSpringSummer != requiredState.isSpringSummer
    )
      return false;

    if (
      requiredState.isWinter !== undefined &&
      this.isWinter != requiredState.isWinter
    )
      return false;

    return true;
  }
}

export class Planner {
  static CalcNeeds(): Need[] {
    let techs = [];
    for (let tech of gamePage.science.techs) {
      if (
        tech.unlocked &&
        !tech.researched &&
        Planner.haveCapacity(tech.prices)
      ) {
        tech.gap = [];
        tech.prices.forEach(function(cost) {
          var res = gamePage.resPool.resourceMap[cost.name];
          if (cost.val > res.value) {
            tech.gap.push({
              name: cost.name,
              affordable: Planner.canAfford(tech.prices),
              gap: cost.val - res.value
            });
          }
        });

        techs.push(tech);
      }
    }

    let needs = [];

    for (let tech of techs) {
      for (let cost of tech.prices) {
        if (needs[cost.name] === undefined) needs[cost.name] = 0;
        needs[cost.name] += cost.val;
      }
    }

    let needsTotal = needs.reduce((sum, cur) => (sum += cur.val), 0);

    let needsArray: Need[] = [];

    Object.keys(needs).forEach(function(needKey) {
      needsArray.push({
        name: needKey,
        val: needs[needKey],
        weight: needs[needKey] / needsTotal
      });
    });

    return needsArray;
  }

  static haveCapacity(prices: Price[]): boolean {
    for (let cost of prices) {
      var res = Game.getResource(cost.name);
      if (res.maxValue > 0 && cost.val > res.maxValue) {
        return false;
      }
    }

    return true;
  }

  static canAfford(prices: Price[]): boolean {
    for (let cost of prices) {
      if (Game.getResource(cost.name).value < cost.val) {
        return false;
      }
    }

    return true;
  }

  static convertToRaw = function(prices: Price[]): Price[] {
    var tempPrices = prices;
    var rawPrices: Price[] = [];

    let more: boolean = true;
    while (more) {
      more = false;
      rawPrices = [];
      for (let price of tempPrices) {
        if (price.name == "wood") {
          rawPrices.push(price);
        } else if (price.name == "furs") {
          rawPrices.push({
            name: "manpower",
            val: price.val
          });
        } else {
          let craft = Game.getCraft(price.name);
          if (craft != null) {
            more = true;
            craft.prices.forEach(function(craftPrice) {
              rawPrices.push({
                name: craftPrice.name,
                val: craftPrice.val * price.val
              });
            });
          } else {
            // TODO: will this push duplicates? (ex: two sciences for blueprint?)
            rawPrices.push(price);
          }
        }
      }

      tempPrices = rawPrices;
    }

    return rawPrices;
  };

  goals: State[];

  private getCurrentState(): State {
    var curState = new State();

    curState.catnipPerTick = Game.getResourcePerTick("catnip");
    curState.isSpringSummer = Game.isSpringSummer();
    curState.isWinter = Game.isWinter();

    return curState;
  }

  public goalTest() {
    var currentState = this.getCurrentState();

    let nextGoal: State;

    for (let goal of this.goals) {
      // TODO: prereqs for goals? goals per season?
      if (!Game.isWinter() && !currentState.satisfies(goal)) {
        nextGoal = goal;
        break;
      }
    }

    if (nextGoal != null) {
      console.log("have goal: " + nextGoal);
    }
  }
}
