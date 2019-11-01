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
    static huntAll() {
        gamePage.village.huntAll();
    }
    static praise() {
        if (gamePage.religionTab.praiseBtn) {
            gamePage.religionTab.praiseBtn.onClick();
        }
        else {
            Game.pushTab('Religion');
            Game.popTab();
        }
    }
    static getResource(resourceName) {
        return gamePage.resPool.resourceMap[resourceName];
    }
    static getResourcePerTick(resourceName) {
        return gamePage.getResourcePerTick(resourceName, true);
    }
    static getRace(raceName) {
        return gamePage.diplomacy.get(raceName);
    }
    static tradeAll(race) {
        gamePage.diplomacy.tradeAll(race);
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
    static get energyProduction() {
        return gamePage.globalEffectsCached.energyProduction;
    }
    static get energyConsumption() {
        return gamePage.globalEffectsCached.energyConsumption;
    }
    static get netEnergy() {
        return Game.energyProduction - Game.energyConsumption;
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
            "<div id='k-options'>" +
            "<input id='k-master-toggle' name='k-master-toggle' type='checkbox' checked='true' /><label for='k-master-toggle'>master switch</label><br/>" +
            '</div>' +
            "<div id='k-msg' /><div id='k-bld' />" +
            "<div id='k-needs'>" +
            "<div id='k-wood' class='bar'>wood</div>" +
            "<div id='k-minerals' class='bar'>minerals</div>" +
            "<div id='k-science' class='bar'>science</div>" +
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
        this.msg = ratios
            .map((jr, i, a) => `${(jr.ratio / a[a.length - 1].ratio).toFixed(2)} ${jr.job.name}`)
            .join('<br/>');
    }
    set model(model) {
        $('#k-wood').css('width', model.wood);
        $('#k-minerals').css('width', model.minerals);
        $('#k-coal').css('width', model.coal);
        $('#k-catpower').css('width', model.manpower);
        $('#k-science').css('width', model.science);
    }
}
const getButton = (label) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};
let tick = () => {
    if ($('input#observeBtn').length === 1) {
        $('input#observeBtn').click();
        console.log('KAI: Observed the sky');
    }
    if (!Game.view.masterEnabled) {
        console.log('KAI: disabled');
        return;
    }
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
    const magneto = getButton('Magneto');
    const mansion = getButton('Mansion');
    const mine = getButton('Mine');
    const observatory = getButton('Observatory');
    const oilWell = getButton('Oil Well');
    const pasture = getButton('Pasture');
    const quarry = getButton('Quarry');
    const smelter = getButton('Smelter');
    const steamworks = getButton('Steamworks');
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
        {
            button: getButton('Accelerator'),
            prereq: () => Game.getResourcePerTick('titanium') > 0.1 && Game.netEnergy > 2,
        },
        {
            button: getButton('Reactor'),
            prereq: () => Game.getResourcePerTick('uranium') > 0.002,
        },
        { button: amphitheatre },
        { button: getButton('Chapel') },
        { button: temple },
        { button: tradepost },
        { button: hut, prereq: Game.isSpringSummer },
        { button: logHouse, prereq: Game.isSpringSummer },
        { button: mansion, prereq: Game.isSpringSummer },
        {
            button: smelter,
            prereq: () => Game.getResourcePerTick('wood') > 0.5 &&
                Game.getResourcePerTick('minerals') > 1.0 &&
                Game.getResourcePerTick('minerals') > Game.getResourcePerTick('iron'),
        },
        { button: magneto, prereq: () => Game.getResourcePerTick('oil') > 0.05 },
        { button: steamworks, prereq: () => magneto.model.on > steamworks.model.on },
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
            refined: 'ship',
            shouldCraft: needs => Game.getResource('ship').value < 285 && needs.get('titanium') > 0,
        },
        {
            refined: 'alloy',
            shouldCraft: () => Game.isFull('titanium') && Game.getResource('steel').value - 75 > Game.getResource('alloy').value,
        },
        {
            refined: 'kerosene',
            shouldCraft: () => Game.isFull('oil'),
        },
    ];
    buildQueue
        .filter(b => b.button && b.button.model.enabled && (b.prereq === undefined || b.prereq()))
        .map(b => new Action('Bonfire', b.button))
        .forEach(a => a.click());
    if (Game.ScienceTab.visible) {
        Game.ScienceTab.buttons
            .filter(b => b.model.metadata.unlocked && !b.model.metadata.researched && Game.canAfford(b.model.prices))
            .map(b => new Action('Science', b))
            .forEach(a => a.click());
    }
    if (Game.WorkshopTab.visible) {
        Game.WorkshopTab.buttons
            .filter(b => b.model.metadata.unlocked && !b.model.metadata.researched && Game.canAfford(b.model.prices))
            .map(b => new Action('Workshop', b))
            .forEach(a => a.click());
    }
    if (Game.ReligionTab.visible) {
        Game.ReligionTab.rUpgradeButtons
            .filter(b => b.model.enabled && Game.canAfford(b.model.prices))
            .map(b => new Action('Religion', b))
            .forEach(a => a.click());
        if (Game.isFull('faith')) {
            Game.praise();
        }
    }
    const needs = Game.BonfireTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .map(price => (Object.assign({}, price, { val: Math.max(0, price.val - Game.getResource(price.name).value) })))
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), new Map());
    Game.ScienceTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .map(price => (Object.assign({}, price, { val: Math.max(0, price.val - Game.getResource(price.name).value) })))
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), needs);
    Game.WorkshopTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .map(price => (Object.assign({}, price, { val: Math.max(0, price.val - Game.getResource(price.name).value) })))
        .reduce((needs, price) => needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val), needs);
    craftQueue
        .filter(c => c.shouldCraft(needs))
        .map(c => Game.getCraft(c.refined))
        .filter(c => c.unlocked && Game.canAfford(c.prices))
        .forEach(c => {
        Game.craft(c.name, 1);
    });
    if (Game.isFull('manpower')) {
        const zebras = Game.getRace('zebras');
        if (zebras.unlocked) {
            console.log('KAI: trading with zebras');
            Game.tradeAll(zebras);
        }
        console.log('KAI: hunting');
        gamePage.village.huntAll();
    }
    const list = [
        { res: 'wood', job: Game.getJob('woodcutter') },
        { res: 'minerals', job: Game.getJob('miner') },
        { res: 'science', job: Game.getJob('scholar') },
        { res: 'coal', job: Game.getJob('geologist') },
    ];
    const jobNeeds = new Map(needs);
    jobNeeds.set('wood', needs.get('wood') || 0 + needs.get('beam') || 0 + needs.get('scaffold') || 0);
    jobNeeds.set('minerals', needs.get('minerals') || 0 + needs.get('slab') || 0 + needs.get('titanium') || 0);
    jobNeeds.set('science', needs.get('science') || 0 + needs.get('compedium') || 0 + needs.get('manuscript') || 0);
    jobNeeds.set('coal', needs.get('coal') || 0 + needs.get('steel') || 0);
    const ratios = list
        .filter(r => jobNeeds.get(r.res))
        .map(r => ({
        name: r.res,
        job: r.job,
        ratio: Game.getResourcePerTick(r.res) / jobNeeds.get(r.res),
    }))
        .sort((a, b) => a.ratio - b.ratio);
    Game.view.jobRatios = ratios;
    if (Game.freeKittens > 0 && ratios.length > 0) {
        Game.assignJob(ratios[0].job);
    }
    else if (Game.isSpringSummer() === true && Game.getResourcePerTick('catnip') <= 0 && ratios.length > 0) {
        const unJob = ratios[ratios.length - 1].job;
        console.log(`KAI: Job - need food, swapped ${unJob.title} to farmer`);
        Game.unassignJob(unJob);
        Game.assignJob(Game.getJob('farmer'));
    }
    else if (ratios.length > 1 && ratios[0].ratio / ratios[ratios.length - 1].ratio < 0.85) {
        const job = ratios[0].job;
        const unJob = ratios[ratios.length - 1].job;
        Game.unassignJob(unJob);
        Game.assignJob(job);
    }
    const viewModel = new ViewModel(needs);
    Game.view.model = viewModel;
};
if (!Game.view) {
    Game.view = new View();
}
if (Game.intervalId)
    clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
