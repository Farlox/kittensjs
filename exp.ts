class State
{
    catnipPerTick : number;
    isSpringSummer : boolean;
    isWinter: boolean;

    prereq?

    public satisfies(requiredState : State) : boolean {
        if (requiredState.catnipPerTick !== undefined && this.catnipPerTick < requiredState.catnipPerTick)
            return false;

        if (requiredState.isSpringSummer !== undefined && this.isSpringSummer != requiredState.isSpringSummer)
            return false;

        if (requiredState.isWinter !== undefined && this.isWinter != requiredState.isWinter)
            return false;

        return true;
    }
}

class Planner {
    goals: State[];

    private getCurrentState() : State {
        var curState = new State();

        curState.catnipPerTick = Game.getResourcePerTick('catnip');
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
            console.log('have goal: ' + nextGoal);
        }
    }
}