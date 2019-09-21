class Game {
    static get BonfireTab() {
        return gamePage.tabs[0];
    }
    static get ScienceTab() {
        return gamePage.libraryTab;
    }
    static getResource(resourceName) {
        return gamePage.resPool.resourceMap[resourceName];
    }
    static isFull(resourceName) {
        let res = Game.getResource(resourceName);
        return res.value >= res.maxValue * 0.95;
    }
    static haveCapacity(prices) {
        for (let cost of prices) {
            var res = Game.getResource(cost.name);
            if (res.maxValue > 0 && cost.val > res.maxValue) {
                return false;
            }
        }
        return true;
    }
    static canAfford(prices) {
        for (let cost of prices) {
            if (Game.getResource(cost.name).value < cost.val) {
                return false;
            }
        }
        return true;
    }
    static pushTab(tabLabel) {
        Game.prevTab = $('a.tab.activeTab')[0].innerText;
        $('a.tab:contains("' + tabLabel + '")')[0].click();
    }
    static popTab() {
        $('a.tab:contains("' + Game.prevTab + '")')[0].click();
        Game.prevTab = null;
    }
}
Game.isSpringSummer = () => gamePage.calendar.season < 2;
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
const getButton = (label) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};
const tick = () => {
    // observe the sky
    if ($('input#observeBtn').length == 1) {
        $('input#observeBtn').click();
        console.log('KAI: Observed the sky');
    }
    // bonfire
    const academy = getButton('Academy');
    const barn = getButton('Barn');
    const field = getButton('Catnip field');
    const hut = getButton('Hut');
    const library = getButton('Library');
    const mine = getButton('Mine');
    const pasture = getButton('Pasture');
    const refine = getButton('Refine catnip');
    const warehouse = getButton('Warehouse');
    const workshop = getButton('Workshop');
    const buildQueue = [
        { button: field, prereq: Game.isSpringSummer },
        { button: pasture, prereq: Game.isSpringSummer },
        { button: hut, prereq: Game.isSpringSummer },
        { button: library },
        { button: academy },
        { button: mine },
        { button: workshop },
        { button: barn },
        { button: warehouse },
        { button: refine, prereq: () => Game.isSpringSummer() && Game.isFull('catnip') },
    ];
    for (const b of buildQueue) {
        if (b.button.model.enabled && (b.prereq === undefined || b.prereq())) {
            new Action('Bonfire', b.button).click();
        }
    }
    // science
    let scienceNeeded = Number.MAX_VALUE;
    if (Game.ScienceTab.visible) {
        for (const b of Game.ScienceTab.buttons) {
            if (b.model.visible) {
                if (b.model.enabled) {
                    new Action('Science', b).click();
                }
                else if (!b.model.resourceIsLimited) {
                    const gap = b.model.prices[0].val - Game.getResource('science').value;
                    if (gap < scienceNeeded) {
                        scienceNeeded = Math.min(scienceNeeded, gap);
                    }
                }
            }
        }
    }
    // console.log(`next science in ${scienceNeeded}`);
};
// run
if (Game.intervalId)
    clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
