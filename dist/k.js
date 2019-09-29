class Game {
    static get BonfireTab() {
        return gamePage.tabs[0];
    }
    static get ScienceTab() {
        return gamePage.libraryTab;
    }
    static get WorkshopTab() {
        return gamePage.workshopTab;
    }
    static getResource(resourceName) {
        return gamePage.resPool.resourceMap[resourceName];
    }
    static getResourcePerTick(resourceName) {
        return gamePage.getResourcePerTick(resourceName, true);
    }
    static craft(resourceName, amount) {
        gamePage.craft(resourceName, amount);
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
    static get freeKittens() {
        return gamePage.village.getFreeKittens();
    }
    static getJob(jobName) {
        return gamePage.village.getJob(jobName);
    }
    static assignJob(job) {
        if (job.unlocked) {
            gamePage.village.assignJob(job);
            return true;
        }
        return false;
    }
    static unassignJob(job) {
        if (job.unlocked) {
            gamePage.village.sim.removeJob(job.name);
        }
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
class View {
    constructor() {
        const left = $('#leftColumnViewport');
        this.panel = $("<div id='kcode'><div id='mode' /><div id='k-options'>" +
            "<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
            "<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
            "<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
            "</div><div id='k-msg' /><div id='k-bld' />" +
            "<div id='k-needs'><div id='k-wood' class='bar'>wood</div><div id='k-minerals' class='bar'>minerals</div><div id='k-coal' class='bar'>coal</div><div id='k-catpower' class='bar'>catpower</div><div id='k-science' class='bar'>science</div></div>" +
            '</div>');
        this.panel.append('<style>#kcode { margin-left: 4px; }' +
            "#kcode #mode::before { color: #808080; content: 'mode: ';}" +
            '#kcode #k-msg { margin-top: 5px; }' +
            '#kcode #k-options { margin-top: 5px; }' +
            '#kcode #k-bld { margin-top: 5px; color: #808080; }' +
            '#kcode #k-needs .bar { background-color:#ccc; color:#333 }' +
            '</style>');
        left.append(this.panel);
    }
    set msg(msg) {
        $('#k-msg').html(msg);
    }
}
const getButton = (label) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};
let tick = () => {
    // observe the sky
    if ($('input#observeBtn').length == 1) {
        $('input#observeBtn').click();
        console.log('KAI: Observed the sky');
    }
    // bonfire
    const academy = getButton('Academy');
    const aqueduct = getButton('Aqueduct');
    const barn = getButton('Barn');
    const field = getButton('Catnip field');
    const hut = getButton('Hut');
    const library = getButton('Library');
    const logHouse = getButton('Log House');
    const lumberMill = getButton('Lumber Mill');
    const mine = getButton('Mine');
    const pasture = getButton('Pasture');
    const smelter = getButton('Smelter');
    const tradepost = getButton('Tradepost');
    const unicornPasture = getButton('Unic. Pasture');
    const warehouse = getButton('Warehouse');
    const workshop = getButton('Workshop');
    const buildQueue = [
        { button: unicornPasture },
        { button: field, prereq: Game.isSpringSummer },
        { button: pasture, prereq: Game.isSpringSummer },
        { button: aqueduct },
        { button: lumberMill },
        { button: library },
        { button: academy },
        { button: mine },
        { button: tradepost },
        { button: hut, prereq: Game.isSpringSummer },
        { button: logHouse, prereq: Game.isSpringSummer },
        {
            button: smelter,
            prereq: () => Game.getResourcePerTick('wood') > 0.05 &&
                Game.getResourcePerTick('minerals') > 0.1 &&
                Game.getResourcePerTick('minerals') > Game.getResourcePerTick('iron'),
        },
        { button: workshop },
        { button: barn },
        { button: warehouse },
    ];
    const craftQueue = [
        { refined: 'wood', refinedAmount: 10, shouldCraft: () => Game.isFull('catnip') },
        {
            refined: 'beam',
            refinedAmount: 1,
            shouldCraft: () => Game.getResource('wood').value - 175 > Game.getResource('beam').value,
        },
        {
            refined: 'scaffold',
            refinedAmount: 1,
            shouldCraft: () => Game.getResource('beam').value - 50 > Game.getResource('scaffold').value,
        },
        { refined: 'slab', refinedAmount: 1, shouldCraft: () => Game.isFull('minerals') },
        { refined: 'plate', refinedAmount: 1, shouldCraft: () => Game.isFull('iron') },
        {
            refined: 'steel',
            refinedAmount: 1,
            shouldCraft: () => Game.getResource('coal').value - 100 > Game.getResource('steel').value &&
                Game.getResource('iron').value - 100 > Game.getResource('steel').value,
        },
        {
            refined: 'gear',
            refinedAmount: 1,
            shouldCraft: () => Game.getResource('steel').value - 15 > Game.getResource('gear').value,
        },
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
    // workshop
    if (Game.WorkshopTab.visible) {
        for (const b of Game.WorkshopTab.buttons) {
            if (b.model.visible) {
                if (b.model.enabled) {
                    new Action('Workshop', b).click();
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
    // hunt
    if (Game.isFull('manpower')) {
        console.log('KAI: hunting');
        gamePage.village.huntAll();
    }
    // jobs
    if (scienceNeeded === Number.MAX_VALUE) {
        // remove scholars
        const s = Game.getJob('scholar');
        if (s.unlocked && s.value > 0) {
            Game.unassignJob(s);
        }
    }
    // craft
    for (const c of craftQueue) {
        if (Game.getResource(c.refined).unlocked && c.shouldCraft()) {
            console.log(`KAI: crafting ${c.refined}`);
            Game.craft(c.refined, c.refinedAmount);
        }
    }
    // needs calc
    let needs = new Map();
    needs = Game.BonfireTab.buttons
        .filter(b => b.model.visible && b.model.visible && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => {
        return flat.concat(next);
    }, [])
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), needs);
    // UI
    if (scienceNeeded < Number.MAX_VALUE) {
        Game.view.msg = `next science in ${scienceNeeded}`;
    }
};
// run
if (!Game.view) {
    Game.view = new View();
}
if (Game.intervalId)
    clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
