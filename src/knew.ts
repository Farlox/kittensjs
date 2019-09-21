const getButton = (label: string) => {
    return Game.BonfireTab.buttons.find(b => b.opts.name === label);
};

interface BuildDef {
    button: Button;
    prereq?: () => boolean;
}

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

    const buildQueue: BuildDef[] = [
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
                } else if (!b.model.resourceIsLimited) {
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
if (Game.intervalId) clearInterval(Game.intervalId);
Game.intervalId = setInterval(() => tick(), 2000);
