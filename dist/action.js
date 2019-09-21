class Action {
    constructor(tabName, button) {
        this._gap = null;
        this._time = null;
        this.tabName = tabName;
        this.button = button;
    }
    get name() {
        return this.button.model.metadata ? this.button.model.metadata.name : this.button.buttonContent.innerText;
    }
    get model() {
        return this.button.model;
    }
    click() {
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
                        val: price.val - res.value
                    });
                }
            }
        }
        return this._gap;
    }
}
