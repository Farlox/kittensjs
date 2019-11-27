class Action {
    private tabName: TabName;
    private button: Button<any>;

    get name(): string {
        return this.button.model.metadata ? this.button.model.metadata.name : this.button.buttonContent.innerText;
    }
    get model(): any {
        return this.button.model;
    }

    private _gap: Price[] = null;
    private _time: number = null;

    constructor(tabName: TabName, button: Button<any>) {
        this.tabName = tabName;
        this.button = button;
    }

    public click(): boolean {
        Game.pushTab(this.tabName);

        let wasEnabled = this.model.enabled;

        if (wasEnabled) {
            this.button.buttonContent.click();
            console.log('KAI: ' + this.tabName + ': ' + this.name);
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
                        val: price.val - res.value,
                    });
                }
            }
        }

        return this._gap;
    }

    // get time() {
    //     if (this._time == null) {
    //         this._time = 0;
    //         var rawGap = Planner.convertToRaw(this.gap);
    //         for (let gap of rawGap) {
    //             if (Game.getResourcePerTick(gap.name) < 0) {
    //                 this._time = Infinity;
    //                 break;
    //             }

    //             this._time += gap.val / (Game.getResourcePerTick(gap.name) * 5);
    //         }
    //     }

    //     return this._time;
    // }
}
