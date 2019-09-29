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
