// trade ship
// first craft
// jobs
// buttons on other tabs not clicking
// praise onclick breaks if religion tab isn't clicked once this session

const getButton = (label: string) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};

interface BuildDef {
    button: Button;
    prereq?: () => boolean;
}

interface CraftDef {
    refined: ResourceName;
    refinedAmount?: number;
    shouldCraft: (needs: Map<ResourceName, number>) => boolean;
}

let tick = () => {
    // observe the sky
    if ($('input#observeBtn').length == 1) {
        $('input#observeBtn').click();
        console.log('KAI: Observed the sky');
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
            prereq: () =>
                Game.getResourcePerTick('wood') > 0.05 &&
                Game.getResourcePerTick('minerals') > 0.1 &&
                Game.getResourcePerTick('minerals') > Game.getResourcePerTick('iron'),
        },
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

    for (const b of buildQueue) {
        if (b.button && b.button.model.enabled && (b.prereq === undefined || b.prereq())) {
            new Action('Bonfire', b.button).click();
        }
    }

    // science
    let scienceNeeded = Number.MAX_VALUE;

    if (Game.ScienceTab.visible) {
        for (const b of Game.ScienceTab.buttons) {
            if (b.model.visible) {
                if (b.model.enabled) {
                    console.log(`**science ready : ${b.opts.name}`);
                    new Action('Science', b).click();
                } else if (!b.model.resourceIsLimited) {
                    const gap = b.model.prices[0].val - Game.getResource('science').value; // TODO: [0] is not science
                    if (gap > 0 && gap < scienceNeeded) {
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
                } else if (!b.model.resourceIsLimited) {
                    const gap = b.model.prices[0].val - Game.getResource('science').value; // TODO: [0] is not science
                    if (gap < scienceNeeded) {
                        scienceNeeded = Math.min(scienceNeeded, gap);
                    }
                }
            }
        }
    }

    // needs calc
    const needs = Game.BonfireTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            new Map<ResourceName, number>()
        );

    Game.ScienceTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            needs
        );

    Game.WorkshopTab.buttons
        .filter(b => b.model.visible && !b.model.enabled && !b.model.resourceIsLimited)
        .map(b => b.model.prices)
        .reduce((flat, next) => flat.concat(next), [])
        .reduce(
            (needs, price) =>
                needs.set(price.name, needs.get(price.name) ? needs.get(price.name) + price.val : price.val),
            needs
        );

    // craft
    for (const c of craftQueue) {
        if (
            Game.getResource(c.refined).unlocked &&
            c.shouldCraft(needs) &&
            Game.canAfford(Game.getCraft(c.refined).prices)
        ) {
            console.log(`KAI: crafting ${c.refined}`);
            Game.craft(c.refined, c.refinedAmount);
        }
    }

    // hunt
    if (Game.isFull('manpower')) {
        console.log('KAI: hunting');
        gamePage.village.huntAll();
    }

    // jobs
    const list: { res: ResourceName; job: Job }[] = [
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

    if (Game.freeKittens > 0 && ratios.length > 1) {
        console.log(`KAI: assigning ${ratios[0].job.title}`);
        Game.assignJob(ratios[0].job);
        console.log(`KAI: would unassign ${ratios[ratios.length - 1].job.title}`);
    } else if (Game.isSpringSummer() === true && Game.getResourcePerTick('catnip') <= 0 && ratios.length > 0) {
        const unJob = ratios[ratios.length - 1].job;
        console.log(`KAI: Job - need food, swapped ${unJob.title} to farmer`);
        Game.unassignJob(unJob);
        Game.assignJob(Game.getJob('farmer'));
    }

    // if (scienceNeeded === Number.MAX_VALUE) {
    //     // remove scholars
    //     const s = Game.getJob('scholar');
    //     if (s.unlocked && s.value > 0) {
    //         Game.unassignJob(s);
    //     }
    // }

    // UI
    const viewModel = new ViewModel(needs);
    Game.view.model = viewModel;

    // if (scienceNeeded < Number.MAX_VALUE) {
    //     Game.view.msg = `next science in ${scienceNeeded}`;
    // }
};

// run
if (!Game.view) {
    Game.view = new View();
}

if (Game.intervalId) clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
