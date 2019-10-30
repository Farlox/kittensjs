// needs does not include crafted items: slabs, beams, etc
// trade for titanium
// religion upgrades
// workshop/science won't click after a reset until one manual click on each tab
// jobs: hunter, farmer, geologist
// craft amounts

const getButton = (label: string) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};

interface BuildDef {
    button: Button<Building>;
    prereq?: () => boolean;
}

interface CraftDef {
    refined: ResourceName;
    refinedAmount?: number;
    shouldCraft: (needs: Map<ResourceName, number>) => boolean;
}

let tick = () => {
    // observe the sky
    if ($('input#observeBtn').length === 1) {
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

    const buildQueue: BuildDef[] = [
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
            prereq: () =>
                Game.getResourcePerTick('wood') > 0.5 &&
                Game.getResourcePerTick('minerals') > 1.0 &&
                Game.getResourcePerTick('minerals') > Game.getResourcePerTick('iron'),
        },
        { button: magneto, prereq: () => Game.getResourcePerTick('oil') > 0.05 },
        // TODO: should be gamePage.bld.buildingsData.find(b => b.name === 'steamworks').val.  ".on" will only count the ones that are on, they aren't by default, and we don't turn them on via script yet.
        { button: steamworks, prereq: () => magneto.model.on > steamworks.model.on },
        { button: workshop },
        { button: barn },
        { button: warehouse },
        { button: harbour },
    ];

    const craftQueue: CraftDef[] = [
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
            shouldCraft: () =>
                Game.getResource('coal').value - 100 > Game.getResource('steel').value &&
                Game.getResource('iron').value - 100 > Game.getResource('steel').value,
        },
        {
            refined: 'gear',
            shouldCraft: () => Game.getResource('steel').value - 15 > Game.getResource('gear').value,
        },
        {
            refined: 'concrate',
            shouldCraft: () =>
                Game.getResource('slab').value - 2500 > Game.getResource('concrate').value &&
                Game.getResource('steel').value - 25 > Game.getResource('concrate').value,
        },
        { refined: 'parchment', shouldCraft: () => Game.getResource('furs').value > 175 },
        {
            refined: 'manuscript',
            shouldCraft: () =>
                Game.getResource('parchment').value - 25 > Game.getResource('manuscript').value &&
                Game.getResource('culture').value > 400,
        },
        {
            refined: 'compedium',
            shouldCraft: () =>
                Game.getResource('manuscript').value - 50 > Game.getResource('compedium').value &&
                Game.getResource('science').value > 10000,
        },
        {
            refined: 'blueprint',
            shouldCraft: () =>
                Game.getResource('compedium').value - 25 > Game.getResource('blueprint').value &&
                Game.getResource('science').value > 25000,
        },
        {
            // 0.35% chance for titanium during zebra trade per trade ship, 100% @ 285
            refined: 'ship',
            shouldCraft: needs => Game.getResource('ship').value < 285 && needs.get('titanium') > 0,
        },
        {
            refined: 'alloy',
            shouldCraft: () =>
                Game.isFull('titanium') && Game.getResource('steel').value - 75 > Game.getResource('alloy').value,
        },
    ];

    // bonfire
    buildQueue
        .filter(b => b.button && b.button.model.enabled && (b.prereq === undefined || b.prereq()))
        .map(b => new Action('Bonfire', b.button))
        .forEach(a => a.click());

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
        .map(price => ({
            ...price,
            val: Math.max(0, price.val - Game.getResource(price.name).value), // gap instead of total required
        }))
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            new Map<ResourceName, number>()
        );

    Game.ScienceTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .map(price => ({
            ...price,
            val: Math.max(0, price.val - Game.getResource(price.name).value), // gap instead of total required
        }))
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            needs
        );

    Game.WorkshopTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .map(price => ({
            ...price,
            val: Math.max(0, price.val - Game.getResource(price.name).value), // gap instead of total required
        }))
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            needs
        );

    // craft
    craftQueue
        .filter(c => c.shouldCraft(needs))
        .map(c => Game.getCraft(c.refined))
        .filter(c => c.unlocked && Game.canAfford(c.prices))
        .forEach(c => {
            // console.log(`KAI: crafting ${c.name}`);
            Game.craft(c.name, 1);
        });

    // hunt or trade
    if (Game.isFull('manpower')) {
        const zebras = Game.getRace('zebras');
        if (zebras.unlocked) {
            console.log('KAI: trading with zebras');
            Game.tradeAll(zebras);
        }

        console.log('KAI: hunting');
        gamePage.village.huntAll();
    }

    // jobs
    const list: { res: ResourceName; job: Job }[] = [
        { res: 'wood', job: Game.getJob('woodcutter') },
        { res: 'minerals', job: Game.getJob('miner') },
        { res: 'science', job: Game.getJob('scholar') },
        { res: 'coal', job: Game.getJob('geologist') },
    ];
    const jobNeeds = new Map(needs);
    jobNeeds.set('wood', needs.get('wood') || 0 + needs.get('beam') || 0 + needs.get('scaffold') || 0);
    jobNeeds.set('minerals', needs.get('minerals') || 0 + needs.get('slab') || 0 + needs.get('titanium') || 0); // titanium needs slabs to trade
    jobNeeds.set('science', needs.get('science') || 0 + needs.get('compedium') || 0 + needs.get('manuscript') || 0);
    jobNeeds.set('coal', needs.get('coal') || 0 + needs.get('steel') || 0);

    const ratios: JobRatio[] = list
        .filter(r => jobNeeds.get(r.res))
        .map(r => ({
            name: r.res,
            job: r.job,
            ratio: Game.getResourcePerTick(r.res) / jobNeeds.get(r.res),
        }))
        .sort((a, b) => a.ratio - b.ratio);

    Game.view.jobRatios = ratios;

    if (Game.freeKittens > 0 && ratios.length > 0) {
        console.log(`KAI: Job assigning free to ${ratios[0].job.title}`);
        Game.assignJob(ratios[0].job);
    } else if (Game.isSpringSummer() === true && Game.getResourcePerTick('catnip') <= 0 && ratios.length > 0) {
        const unJob = ratios[ratios.length - 1].job;
        console.log(`KAI: Job - need food, swapped ${unJob.title} to farmer`);
        Game.unassignJob(unJob);
        Game.assignJob(Game.getJob('farmer'));
    } else if (ratios.length > 1 && ratios[0].ratio / ratios[ratios.length - 1].ratio < 0.85) {
        const job = ratios[0].job;
        const unJob = ratios[ratios.length - 1].job;
        console.log(`KAI: Job - swapped ${unJob.name} to ${job.name}`);
        Game.unassignJob(unJob);
        Game.assignJob(job);
    }

    // UI
    const viewModel = new ViewModel(needs);
    Game.view.model = viewModel;
};

// run
if (!Game.view) {
    Game.view = new View();
}

if (Game.intervalId) clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
