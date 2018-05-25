var State = (function () {
    function State() {
    }
    State.prototype.satisfies = function (requiredState) {
        if (requiredState.catnipPerTick !== undefined && this.catnipPerTick < requiredState.catnipPerTick)
            return false;
        if (requiredState.isSpringSummer !== undefined && this.isSpringSummer != requiredState.isSpringSummer)
            return false;
        if (requiredState.isWinter !== undefined && this.isWinter != requiredState.isWinter)
            return false;
        return true;
    };
    return State;
}());
var Planner = (function () {
    function Planner() {
    }
    Planner.CalcNeeds = function () {
        var techs = [];
        var _loop_1 = function (tech) {
            if (tech.unlocked &&
                !tech.researched &&
                Planner.haveCapacity(tech.prices)) {
                tech.gap = [];
                tech.prices.forEach(function (cost) {
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
        };
        for (var _i = 0, _a = gamePage.science.techs; _i < _a.length; _i++) {
            var tech = _a[_i];
            _loop_1(tech);
        }
        ;
        var needs = [];
        for (var _b = 0, techs_1 = techs; _b < techs_1.length; _b++) {
            var tech = techs_1[_b];
            var rawPrices = Planner.convertToRaw(tech.prices);
            for (var _c = 0, rawPrices_1 = rawPrices; _c < rawPrices_1.length; _c++) {
                var cost = rawPrices_1[_c];
                if (needs[cost.name] === undefined)
                    needs[cost.name] = cost.val;
                needs[cost.name] += cost.val;
            }
        }
        return needs;
    };
    Planner.haveCapacity = function (prices) {
        for (var _i = 0, prices_1 = prices; _i < prices_1.length; _i++) {
            var cost = prices_1[_i];
            var res = Game.getResource(cost.name);
            if (res.maxValue > 0 && cost.val > res.maxValue) {
                return false;
            }
        }
        ;
        return true;
    };
    Planner.canAfford = function (prices) {
        for (var _i = 0, prices_2 = prices; _i < prices_2.length; _i++) {
            var cost = prices_2[_i];
            if (Game.getResource(cost.name).value < cost.val) {
                return false;
            }
        }
        ;
        return true;
    };
    Planner.prototype.getCurrentState = function () {
        var curState = new State();
        curState.catnipPerTick = Game.getResourcePerTick('catnip');
        curState.isSpringSummer = Game.isSpringSummer();
        curState.isWinter = Game.isWinter();
        return curState;
    };
    Planner.prototype.goalTest = function () {
        var currentState = this.getCurrentState();
        var nextGoal;
        for (var _i = 0, _a = this.goals; _i < _a.length; _i++) {
            var goal = _a[_i];
            // TODO: prereqs for goals? goals per season?
            if (!Game.isWinter() && !currentState.satisfies(goal)) {
                nextGoal = goal;
                break;
            }
        }
        if (nextGoal != null) {
            console.log('have goal: ' + nextGoal);
        }
    };
    return Planner;
}());
Planner.convertToRaw = function (prices) {
    var tempPrices = prices;
    var rawPrices = [];
    var more = true;
    while (more) {
        more = false;
        rawPrices = [];
        var _loop_2 = function (price) {
            if (price.name == "wood") {
                rawPrices.push(price);
            }
            else if (price.name == "furs") {
                rawPrices.push({
                    name: 'manpower',
                    val: price.val
                });
            }
            else {
                var craft = Game.getCraft(price.name);
                if (craft != null) {
                    more = true;
                    craft.prices.forEach(function (craftPrice) {
                        rawPrices.push({
                            name: craftPrice.name,
                            val: craftPrice.val * price.val
                        });
                    });
                }
                else {
                    // TODO: will this push duplicates? (ex: two sciences for blueprint?)
                    rawPrices.push(price);
                }
            }
        };
        for (var _i = 0, tempPrices_1 = tempPrices; _i < tempPrices_1.length; _i++) {
            var price = tempPrices_1[_i];
            _loop_2(price);
        }
        ;
        tempPrices = rawPrices;
    }
    return rawPrices;
};
