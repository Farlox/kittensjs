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
    static get ReligionTab() {
        return gamePage.religionTab;
    }
    // misc tab buttons
    static huntAll() {
        gamePage.village.huntAll();
    }
    /**
     * Praises the sun in the Religion Tab
     *
     * Converts faith to total pool
     */
    static praise() {
        if (gamePage.religionTab.praiseBtn) {
            gamePage.religionTab.praiseBtn.onClick();
        }
        else {
            Game.pushTab('Religion');
            Game.popTab();
        }
    }
    // resources
    static getResource(resourceName) {
        return gamePage.resPool.resourceMap[resourceName];
    }
    static getResourcePerTick(resourceName) {
        return gamePage.getResourcePerTick(resourceName, true);
    }
    static getCraft(resourceName) {
        return gamePage.workshop.getCraft(resourceName);
    }
    static craft(resourceName, amount = 1) {
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
    // jobs
    static get freeKittens() {
        return gamePage.village.getFreeKittens();
    }
    static getJob(jobName) {
        return gamePage.village.getJob(jobName);
    }
    static assignJob(job, amount = 1) {
        if (job.unlocked) {
            gamePage.village.assignJob(job, amount);
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
                        val: price.val - res.value,
                    });
                }
            }
        }
        return this._gap;
    }
}
class ViewModel {
    constructor(needs) {
        this.list = ['wood', 'minerals', 'coal', 'manpower', 'science'];
        this.getRatio = (res, needs) => needs.get(res) ? (needs.get(res) / this.totalNeeded) * 100 : 0;
        this.totalNeeded = this.list.reduce((tot, next) => tot + (needs.get(next) ? needs.get(next) : 0), 0);
        this.wood = this.getRatio('wood', needs);
        this.minerals = this.getRatio('minerals', needs);
        this.coal = this.getRatio('coal', needs);
        this.manpower = this.getRatio('manpower', needs);
        this.science = this.getRatio('science', needs);
    }
}
class View {
    constructor() {
        const left = $('#leftColumnViewport');
        this.panel = $("<div id='kcode'>" +
            // "<div id='mode' />
            "<div id='k-options'>" +
            "<input id='k-master-toggle' name='k-master-toggle' type='checkbox' checked='true' /><label for='k-master-toggle'>master switch</label><br/>" +
            // "<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
            // "<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
            // "<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
            '</div>' +
            "<div id='k-msg' /><div id='k-bld' />" +
            "<div id='k-needs'>" +
            "<div id='k-wood' class='bar'>wood</div>" +
            "<div id='k-minerals' class='bar'>minerals</div>" +
            "<div id='k-science' class='bar'>science</div></div>" +
            "<div id='k-coal' class='bar'>coal</div>" +
            "<div id='k-catpower' class='bar'>catpower</div>" +
            '</div>');
        this.panel.append('<style>#kcode { margin-left: 4px; }' +
            "#kcode #mode::before { color: #808080; content: 'mode: ';}" +
            '#kcode #k-msg { margin-top: 5px; }' +
            '#kcode #k-options { margin-top: 5px; }' +
            '#kcode #k-bld { margin-top: 5px; color: #808080; }' +
            '#kcode #k-needs .bar { background-color:#ccc; color:#333 }' +
            '.craftTable { padding-bottom: 0 !important }' +
            '</style>');
        left.append(this.panel);
    }
    set msg(msg) {
        $('#k-msg').html(msg);
    }
    get masterEnabled() {
        const toggle = $('#k-master-toggle')[0];
        return toggle && toggle.checked;
    }
    set jobRatios(ratios) {
        this.msg = ratios.map(q => `${q.job.name} ${q.ratio.toExponential(1)}`).join('<br/>');
    }
    set model(model) {
        $('#k-wood').css('width', model.wood);
        $('#k-minerals').css('width', model.minerals);
        $('#k-coal').css('width', model.coal);
        $('#k-catpower').css('width', model.manpower);
        $('#k-science').css('width', model.science);
    }
}
// jobs
// buttons on other tabs not clicking
// praise onclick breaks if religion tab isn't clicked once this session
// smelter built too early and kills production
const getButton = (label) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};
let tick = () => {
    // observe the sky
    if ($('input#observeBtn').length == 1) {
        $('input#observeBtn').click();
        console.log('KAI: Observed the sky');
    }
    if (!Game.view.masterEnabled) {
        console.log('KAI: disabled');
        return;
    }
    // praise
    if (Game.isFull('faith')) {
        Game.praise();
    }
    // bonfire
    const academy = getButton('Academy');
    const amphitheatre = getButton('Amphitheatre');
    const aqueduct = getButton('Aqueduct');
    const barn = getButton('Barn');
    const calciner = getButton('Calciner');
    const field = getButton('Catnip field');
    const harbour = getButton('Harbour');
    const hut = getButton('Hut');
    const library = getButton('Library');
    const logHouse = getButton('Log House');
    const lumberMill = getButton('Lumber Mill');
    const mansion = getButton('Mansion');
    const mine = getButton('Mine');
    const observatory = getButton('Observatory');
    const oilWell = getButton('Oil Well');
    const pasture = getButton('Pasture');
    const quarry = getButton('Quarry');
    const smelter = getButton('Smelter');
    const temple = getButton('Temple');
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
        { button: observatory },
        { button: mine },
        { button: quarry },
        { button: oilWell },
        {
            button: calciner,
            prereq: () => Game.getResourcePerTick('minerals') > 1.5 && Game.getResourcePerTick('oil') > 0.02,
        },
        { button: amphitheatre },
        { button: temple },
        { button: tradepost },
        { button: hut, prereq: Game.isSpringSummer },
        { button: logHouse, prereq: Game.isSpringSummer },
        { button: mansion, prereq: Game.isSpringSummer },
        {
            button: smelter,
            // building smelters too early kills wood and mineral production. floors are set to 10x price
            prereq: () => Game.getResourcePerTick('wood') > 0.5 &&
                Game.getResourcePerTick('minerals') > 1.0 &&
                Game.getResourcePerTick('minerals') > Game.getResourcePerTick('iron'),
        },
        { button: workshop },
        { button: barn },
        { button: warehouse },
        { button: harbour },
    ];
    const craftQueue = [
        { refined: 'wood', refinedAmount: 10, shouldCraft: () => Game.isFull('catnip') },
        { refined: 'beam', shouldCraft: () => Game.isFull('wood') },
        {
            refined: 'scaffold',
            shouldCraft: () => Game.getResource('beam').value - 50 > Game.getResource('scaffold').value,
        },
        { refined: 'slab', shouldCraft: () => Game.isFull('minerals') },
        { refined: 'plate', shouldCraft: () => Game.isFull('iron') },
        {
            refined: 'steel',
            shouldCraft: () => Game.getResource('coal').value - 100 > Game.getResource('steel').value &&
                Game.getResource('iron').value - 100 > Game.getResource('steel').value,
        },
        {
            refined: 'gear',
            shouldCraft: () => Game.getResource('steel').value - 15 > Game.getResource('gear').value,
        },
        {
            refined: 'concrate',
            shouldCraft: () => Game.getResource('slab').value - 2500 > Game.getResource('concrate').value &&
                Game.getResource('steel').value - 25 > Game.getResource('concrate').value,
        },
        { refined: 'parchment', shouldCraft: () => Game.getResource('furs').value > 175 },
        {
            refined: 'manuscript',
            shouldCraft: () => Game.getResource('parchment').value - 25 > Game.getResource('manuscript').value &&
                Game.getResource('culture').value > 400,
        },
        {
            refined: 'compedium',
            shouldCraft: () => Game.getResource('manuscript').value - 50 > Game.getResource('compedium').value &&
                Game.getResource('science').value > 10000,
        },
        {
            refined: 'blueprint',
            shouldCraft: () => Game.getResource('compedium').value - 25 > Game.getResource('blueprint').value &&
                Game.getResource('science').value > 25000,
        },
        {
            // 0.35% chance for titanium during zebra trade per trade ship, 100% @ 285
            refined: 'ship',
            shouldCraft: needs => Game.getResource('ship').value < 285 && needs.get('titanium') > 0,
        },
        {
            refined: 'alloy',
            shouldCraft: () => Game.isFull('titanium') && Game.getResource('steel').value - 75 > Game.getResource('alloy').value,
        },
    ];
    for (const b of buildQueue) {
        if (b.button && b.button.model.enabled && (b.prereq === undefined || b.prereq())) {
            new Action('Bonfire', b.button).click();
        }
    }
    // science
    if (Game.ScienceTab.visible) {
        Game.ScienceTab.buttons
            .filter(b => b.model.metadata.unlocked && !b.model.metadata.researched && Game.canAfford(b.model.prices))
            .map(b => new Action('Science', b))
            .forEach(a => a.click());
    }
    // workshop
    if (Game.WorkshopTab.visible) {
        Game.WorkshopTab.buttons
            .filter(b => b.model.metadata.unlocked && !b.model.metadata.researched && Game.canAfford(b.model.prices))
            .map(b => new Action('Workshop', b))
            .forEach(a => a.click());
    }
    // needs calc
    const needs = Game.BonfireTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), new Map());
    Game.ScienceTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), needs);
    Game.WorkshopTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), needs);
    // craft
    craftQueue
        .filter(c => c.shouldCraft(needs))
        .map(c => Game.getCraft(c.refined))
        .filter(c => c.unlocked && Game.canAfford(c.prices))
        .forEach(c => {
        console.log(`KAI: crafting ${c.name}`);
        Game.craft(c.name, 1);
    });
    // hunt
    if (Game.isFull('manpower')) {
        console.log('KAI: hunting');
        gamePage.village.huntAll();
    }
    // jobs
    const list = [
        { res: 'wood', job: Game.getJob('woodcutter') },
        { res: 'minerals', job: Game.getJob('miner') },
        { res: 'science', job: Game.getJob('scholar') },
    ];
    const ratios = list
        .filter(r => needs.get(r.res))
        .map(r => ({
        name: r.res,
        job: r.job,
        ratio: Game.getResourcePerTick(r.res) / needs.get(r.res),
    }))
        .sort((a, b) => a.ratio - b.ratio);
    Game.view.jobRatios = ratios;
    if (Game.freeKittens > 0 && ratios.length > 0) {
        console.log(`KAI: assigning ${ratios[0].job.title}`);
        Game.assignJob(ratios[0].job);
        console.log(`KAI: would unassign ${ratios[ratios.length - 1].job.title}`);
    }
    else if (Game.isSpringSummer() === true && Game.getResourcePerTick('catnip') <= 0 && ratios.length > 0) {
        const unJob = ratios[ratios.length - 1].job;
        console.log(`KAI: Job - need food, swapped ${unJob.title} to farmer`);
        Game.unassignJob(unJob);
        Game.assignJob(Game.getJob('farmer'));
    }
    // UI
    const viewModel = new ViewModel(needs);
    Game.view.model = viewModel;
};
// run
if (!Game.view) {
    Game.view = new View();
}
if (Game.intervalId)
    clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
