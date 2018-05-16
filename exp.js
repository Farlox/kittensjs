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
