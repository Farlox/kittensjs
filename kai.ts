// Kitten Kai
let gamePage : GamePage;

let convertToRaw = function(prices : Price[]) : Price[] {
    var tempPrices = prices;
    var rawPrices : Price[] = [];
    
    let more: boolean = true;
    while (more) {
        more = false;
        rawPrices = [];
        for (let price of tempPrices) {
            if (price.name == "wood") {
                rawPrices.push(price);
            } else if (price.name == "furs") {
                rawPrices.push({
                    name: 'manpower',
                    val: price.val
                });
            } else {
                let craft = gamePage.workshop.getCraft(price.name);
                if (craft != null) {
                    more = true;
                    craft.prices.forEach(
                        function(craftPrice) { rawPrices.push(
                        { 
                            name: craftPrice.name,
                            val: craftPrice.val * price.val
                        });
                    })
                } else {
                    // TODO: will this push duplicates? (ex: two sciences for blueprint?)
                    rawPrices.push(price);
                }
            }
        };

        tempPrices = rawPrices;
    }

    return rawPrices;
}

class Action
{
    private tabName: string;
    private button: any;

    get name() : string { return this.button.model.metadata.name; }
    get model() : any { return this.button.model; }

    private _gap: Price[] = null;
    private _time : number = null;

    constructor(tabName : string, button : Button) {
        this.tabName = tabName;
        this.button = button;
    }

    public click() : boolean {
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
            var rawGap = convertToRaw(this.gap);
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

class Kai {
    public intervalId: number = undefined;

    public stop() {
        if (this.intervalId != undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            console.log("stopped.");
        }
    }

    public tick() {
        console.log("KAI: tick");
        let catnipProd = Game.getResourcePerTick('catnip');

        // 0. Affordable Workshop, Science, Religion
        for (let upgrade of this.enumerateAffordableActions(Game.WorkshopTab, 'Workshop')) {
            if (upgrade.click()) break;
        }

        for (let research of this.enumerateAffordableActions(Game.ScienceTab, 'Science')) {
            if (research.click()) break;
        }

        // TODO: Religion

        // 1. Build things
        for (let bld of this.enumerateAffordableActions(Game.BonfireTab, 'Bonfire')) {
            if (this.prereqs[bld.name] === undefined || this.prereqs[bld.name]()) {
                if (bld.click()) break;
            }
        }

        // TODO: determine needs for the next items

        // TODO: craft resources that are at capped
        for (let craft of this.craftOrder) {
            if (this.isFull(craft.raw) && Game.getResource(craft.refined).unlocked) {
                // amount acquired in 20 seconds
                let seconds = 20;
                let rawAmount = seconds * Game.const.ticksPerSecond * gamePage.getResourcePerTick(craft.raw, true);
                let refinedAmount = rawAmount / craft.ratio;
                if (refinedAmount <= 0) continue;
                gamePage.craft(craft.refined, refinedAmount);
                console.log("KAI: crafted " + craft.refined);
            }
        }
        // TODO: beam to scaffold if needed
        if (this.isFull('coal')) {

        }
        
        if (this.isFull('iron')) {

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

    private enumerateAffordableActions(tab: Tab, tabLabel: string) : Action[] {
        let actions: Action[] = [];

        if (tab.visible) {
            for (let btn of tab.buttons) {
                if (btn.model.visible &&
                    btn.model.metadata !== undefined &&
                    btn.model.metadata.unlocked &&
                    !btn.model.metadata.researched &&
                    this.canAfford(btn.model.prices))
                {
                    actions.push(new Action(tabLabel, btn));
                }
            }
        }

        return actions;
    }

    private isFull(resourceName: string) : boolean {
        let res = Game.getResource(resourceName);
        return res.value >= res.maxValue * 0.95;
    }

    prereqs = {
        field: function() { return Game.isSpringSummer() },
        pasture: function() { return Game.isSpringSummer(); },
        steamworks: function() { return gamePage.globalEffectsCached.energyProduction - gamePage.globalEffectsCached.energyConsumption < 2; },
        oilWell: function() { return !gamePage.workshop.get('pumpjack').unlocked || gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; },
        //smelter: function() { return k.needs.iron > 0; },
        warehouse: function() {
            let w = gamePage.bld.getPrices('warehouse');
            return gamePage.resPool.resourceMap[w[0].name].value * 0.1 > w[0].val &&
                   gamePage.resPool.resourceMap[w[1].name].value * 0.1 > w[1].val;
        },
        harbor: function() {
            var h = gamePage.bld.getPrices('harbor');
            return gamePage.resPool.resourceMap[h[0].name].value * 0.1 > h[0].val &&
                   gamePage.resPool.resourceMap[h[1].name].value * 0.1 > h[1].val &&
                   gamePage.resPool.resourceMap[h[2].name].value * 0.1 > h[2].val;
        },
        calciner: function() { return gamePage.getResourcePerTick("oil", true) > 0.05 && gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; },
        magneto: function() { return gamePage.getResourcePerTick("oil", true) > 0.05; },
        reactor: function() { return gamePage.getResourcePerTick("uranium", true) >= 0.001; },
        ziggurat: function() { return gamePage.bld.get('ziggurat').val < 1; },
        factory: function() { return false; },
        mint: function() { return false; },
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
    ];

    // lists actions within capacity
    public enumerateActionsWithinCapacity() : Action[] {
        let actions = new Array<Action>();

        // buildings
        for (let b of Game.BonfireTab.buttons) {
            if (b.model.metadata !== undefined) {
                var model = b.model;
                var name = model.metadata.name;

                if ((this.prereqs[name] === undefined || this.prereqs[name]()) &&
                    this.haveCapacity(model.prices)) {
                    actions.push(new Action('Bonfire', b));
                }
            }
        };

        // workshop upgrades
        if (gamePage.workshopTab.visible) {
            for (let btn of Game.WorkshopTab.buttons) {
                if (btn.model.visible &&
                    btn.model.metadata.unlocked &&
                    !btn.model.metadata.researched &&
                    this.haveCapacity(btn.model.prices))
                {
                    actions.push(new Action('Workshop', btn));
                }
            }
        }

        // science research
        if (gamePage.libraryTab.visible) {
            for (let btn of Game.ScienceTab.buttons) {
                if (btn.model.visible &&
                    btn.model.metadata.unlocked && 
                    !btn.model.metadata.researched &&
                    this.haveCapacity(btn.model.prices))
                {
                    actions.push(new Action('Science', btn));
                }
            };
        }
        
        return actions;
    }

    private haveCapacity(prices: Price[]) : boolean {
        for (let cost of prices) {
            var res = Game.getResource(cost.name);
            if (res.maxValue > 0 && cost.val > res.maxValue) {
                return false;
            }
        };

        return true;
    }

    private canAfford(prices: Price[]) : boolean {
        for (let cost of prices) {
            if (Game.getResource(cost.name).value < cost.val) {
                return false;
            }
        };

        return true;
    }
}

if (a != undefined) a.stop();
var a = new Kai();
a.intervalId = setInterval(function() { a.tick(); }, 5000);
console.log("KAI: started.");
