// Kitten Kai
var Action = (function () {
    function Action(tabName, button) {
        this._gap = null;
        this._time = null;
        this.tabName = tabName;
        this.button = button;
    }
    Object.defineProperty(Action.prototype, "name", {
        get: function () { return this.button.model.metadata.name; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action.prototype, "model", {
        get: function () { return this.button.model; },
        enumerable: true,
        configurable: true
    });
    Action.prototype.click = function () {
        Game.pushTab(this.tabName);
        var wasEnabled = this.model.enabled;
        if (wasEnabled) {
            this.button.buttonContent.click();
            console.log("KAI: " + this.tabName + ": " + this.name);
        }
        Game.popTab();
        return wasEnabled;
    };
    Object.defineProperty(Action.prototype, "gap", {
        get: function () {
            if (this._gap == null) {
                this._gap = [];
                for (var _i = 0, _a = this.model.prices; _i < _a.length; _i++) {
                    var price = _a[_i];
                    var res = Game.getResource(price.name);
                    if (res.value < price.val) {
                        this._gap.push({
                            name: price.name,
                            val: price.val - res.value
                        });
                    }
                }
            }
            return this._gap;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action.prototype, "time", {
        get: function () {
            if (this._time == null) {
                this._time = 0;
                var rawGap = Planner.convertToRaw(this.gap);
                for (var _i = 0, rawGap_1 = rawGap; _i < rawGap_1.length; _i++) {
                    var gap = rawGap_1[_i];
                    if (Game.getResourcePerTick(gap.name) < 0) {
                        this._time = Infinity;
                        break;
                    }
                    this._time += gap.val / (Game.getResourcePerTick(gap.name) * 5);
                }
            }
            return this._time;
        },
        enumerable: true,
        configurable: true
    });
    return Action;
}());
var Kai = (function () {
    function Kai() {
        this.intervalId = undefined;
        this.needs = [];
        this.prereqs = {
            field: function () { return Game.isSpringSummer(); },
            pasture: function () { return Game.isSpringSummer(); },
            steamworks: function () { return Game.NetEnergy < 2; },
            oilWell: function () { return !gamePage.workshop.get('pumpjack').unlocked || Game.NetEnergy > 0; },
            //smelter: function() { return k.needs.iron > 0; },
            warehouse: function () {
                var w = gamePage.bld.getPrices('warehouse');
                return Game.getResource(w[0].name).value * 0.1 > w[0].val &&
                    Game.getResource(w[1].name).value * 0.1 > w[1].val;
            },
            harbor: function () {
                var h = gamePage.bld.getPrices('harbor');
                return Game.getResource(h[0].name).value * 0.1 > h[0].val &&
                    Game.getResource(h[1].name).value * 0.1 > h[1].val &&
                    Game.getResource(h[2].name).value * 0.1 > h[2].val;
            },
            calciner: function () { return Game.getResourcePerTick("oil") > 0.05 && Game.NetEnergy > 0; },
            magneto: function () { return Game.getResourcePerTick("oil") > 0.05; },
            reactor: function () { return Game.getResourcePerTick("uranium") >= 0.001; },
            ziggurat: function () { return gamePage.bld.get('ziggurat').val < 1; },
            factory: function () { return false; },
            mint: function () { Game.getResourcePerTick('furs') < 0 || Game.getResourcePerTick('ivory') < 0; },
        };
        this.craftOrder = [
            { raw: "wood", refined: "beam", ratio: 175 },
            { raw: "catnip", refined: "wood", ratio: 100 },
            { raw: "wood", refined: "beam", ratio: 175 },
            { raw: "minerals", refined: "slab", ratio: 250 },
            { raw: "coal", refined: "steel", ratio: 100 },
            { raw: "iron", refined: "plate", ratio: 125 },
            { raw: "titanium", refined: "alloy", ratio: 10 },
            { raw: "oil", refined: "kerosene", ratio: 7500 },
            { raw: "uranium", refined: "thorium", ratio: 250 },
        ];
    }
    Kai.prototype.stop = function () {
        if (this.intervalId != undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            console.log("stopped.");
        }
    };
    Kai.prototype.tick = function () {
        console.log("KAI: tick");
        var catnipProd = Game.getResourcePerTick('catnip');
        // 0. Affordable Workshop, Science, Religion
        for (var _i = 0, _a = this.enumerateAffordableActions(Game.WorkshopTab, 'Workshop'); _i < _a.length; _i++) {
            var upgrade = _a[_i];
            if (upgrade.click())
                break;
        }
        for (var _b = 0, _c = this.enumerateAffordableActions(Game.ScienceTab, 'Science'); _b < _c.length; _b++) {
            var research = _c[_b];
            if (research.click())
                break;
        }
        // TODO: Religion
        // 1. Build things
        for (var _d = 0, _e = this.enumerateAffordableActions(Game.BonfireTab, 'Bonfire'); _d < _e.length; _d++) {
            var bld = _e[_d];
            if (this.prereqs[bld.name] === undefined || this.prereqs[bld.name]()) {
                if (bld.click())
                    break;
            }
        }
        // 2. Build space things
        if (Game.SpaceTab.visible) {
            for (var _f = 0, _g = Game.SpaceTab.planetPanels; _f < _g.length; _f++) {
                var planet = _g[_f];
                for (var _h = 0, _j = planet.children; _h < _j.length; _h++) {
                    var btn = _j[_h];
                    if (btn.model.visible &&
                        btn.model.metadata !== undefined &&
                        btn.model.metadata.unlocked &&
                        Planner.canAfford(btn.model.prices)) {
                        new Action("Space", btn).click();
                    }
                }
            }
        }
        // TODO: determine needs for the next items
        this.needs = Planner.CalcNeeds();
        // TODO: craft resources that are at capped
        for (var _k = 0, _l = this.craftOrder; _k < _l.length; _k++) {
            var craft = _l[_k];
            if (this.isFull(craft.raw) && Game.getResource(craft.refined).craftable) {
                // amount acquired in 20 seconds
                var seconds = 20;
                var rawAmount = seconds * Game.const.ticksPerSecond * Game.getResourcePerTick(craft.raw);
                var refinedAmount = rawAmount / craft.ratio;
                if (refinedAmount <= 0)
                    continue;
                Game.craft(craft.refined, refinedAmount);
                console.log("KAI: crafted " + refinedAmount + " " + craft.refined);
            }
        }
        // TODO: beam to scaffold if needed
        var beam = Game.getResource('beam');
        var scaffold = Game.getResource('scaffold');
        if (scaffold.unlocked && beam.value >= Game.const.beamPerScaffold && scaffold.value < 0.1 * beam.value) {
            var amount = Math.max(1, 0.01 * beam.value / Game.const.beamPerScaffold);
            console.log("KAI: crafted " + amount + " scaffold");
            Game.craft('scaffold', amount);
        }
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
    };
    Kai.prototype.enumerateAffordableActions = function (tab, tabLabel) {
        var actions = [];
        if (tab.visible) {
            for (var _i = 0, _a = tab.buttons; _i < _a.length; _i++) {
                var btn = _a[_i];
                if (btn.model.visible &&
                    btn.model.metadata !== undefined &&
                    btn.model.metadata.unlocked &&
                    !btn.model.metadata.researched &&
                    Planner.canAfford(btn.model.prices)) {
                    actions.push(new Action(tabLabel, btn));
                }
            }
        }
        return actions;
    };
    Kai.prototype.isFull = function (resourceName) {
        var res = Game.getResource(resourceName);
        return res.value >= res.maxValue * 0.95;
    };
    // lists actions within capacity
    Kai.prototype.enumerateActionsWithinCapacity = function () {
        var actions = new Array();
        // buildings
        for (var _i = 0, _a = Game.BonfireTab.buttons; _i < _a.length; _i++) {
            var b = _a[_i];
            if (b.model.metadata !== undefined) {
                var model = b.model;
                var name = model.metadata.name;
                if ((this.prereqs[name] === undefined || this.prereqs[name]()) &&
                    Planner.haveCapacity(model.prices)) {
                    actions.push(new Action('Bonfire', b));
                }
            }
        }
        ;
        // workshop upgrades
        if (Game.WorkshopTab.visible) {
            for (var _b = 0, _c = Game.WorkshopTab.buttons; _b < _c.length; _b++) {
                var btn = _c[_b];
                if (btn.model.visible &&
                    btn.model.metadata.unlocked &&
                    !btn.model.metadata.researched &&
                    Planner.haveCapacity(btn.model.prices)) {
                    actions.push(new Action('Workshop', btn));
                }
            }
        }
        // science research
        if (Game.ScienceTab.visible) {
            for (var _d = 0, _e = Game.ScienceTab.buttons; _d < _e.length; _d++) {
                var btn = _e[_d];
                if (btn.model.visible &&
                    btn.model.metadata.unlocked &&
                    !btn.model.metadata.researched &&
                    Planner.haveCapacity(btn.model.prices)) {
                    actions.push(new Action('Science', btn));
                }
            }
            ;
        }
        return actions;
    };
    return Kai;
}());
if (a != undefined)
    a.stop();
var a = new Kai();
a.intervalId = setInterval(function () { a.tick(); }, 5000);
console.log("KAI: started.");
