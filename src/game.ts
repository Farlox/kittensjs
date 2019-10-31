interface Button<TMetadata> {
    model: {
        enabled: boolean;
        prices: Price[];
        resourceIsLimited: boolean;
        visible: boolean;
        metadata: TMetadata;
        on: number;

        [key: string]: any;
    };

    opts: {
        name: string; // bonfire
        id: string; // science
    };

    buttonContent: HTMLDivElement;
}

interface Price {
    name: ResourceName;
    val: number;
}

interface Tab<T> {
    visible: boolean;
    buttons: Button<T>[];
}

interface IReligionTab extends Tab<any> {
    praiseBtn: any;
    rUpgradeButtons: Button<any>[];
}

interface Resource {
    name: string;
    visible: boolean;
    craftable: boolean;
    unlocked: boolean;
    value: number;
    maxValue: number;
}

interface Craft {
    description: string;
    isLimited: boolean;
    label: string;
    name: ResourceName;
    prices: Price[];
    unlocked: boolean;
    value: 0;
}

interface Building {
    label: string;
    name: BuildingName;
    // on: number;
    prices: Price[];
    unlockable: boolean;
    unlocked: boolean;
    val: number;
}

interface Upgrade {
    name: string;
    label: string;
    prices: Price[];
    researched: boolean;
    unlocked: boolean;
}

interface Tech {
    name: string;
    label: string;
    prices: Price[];
    researched: boolean;
    unlocked: boolean;
}

interface Job {
    description: string;
    modifiers: any;
    name: JobName;
    title: string;
    unlocked: boolean;
    value: number;
}

interface JobRatio {
    name: ResourceName;
    job: Job;
    ratio: number;
}

interface Race {
    name: string;
    Title: string;
    unlocked: boolean;
}

interface GamePage {
    calendar: {
        season: number;
    };

    resPool: any;
    getResourcePerTick(resName: ResourceName, withConversion: boolean);

    craft: (resName: ResourceName, value: number) => void;

    tabs: Tab<any>[];
    libraryTab: Tab<Tech>;
    workshopTab: Tab<Upgrade>;
    religionTab: Tab<any> & IReligionTab;

    bld: {
        get(buildingName: BuildingName): Building;
    };

    workshop: {
        getCraft(resourceName: ResourceName): Craft;
    };

    village: {
        getJob(jobName: JobName);
        assignJob(job: Job, amt: number);
        getFreeKittens(): number;
        sim: {
            removeJob(jobName: JobName);
        };

        huntAll: () => void;
    };

    diplomacy: {
        game: any;
        get(race: RaceName): Race;
        tradeAll(race: Race): void;
    };
}

class Game {
    static intervalId?: number;
    static view: View;

    static isSpringSummer = () => gamePage.calendar.season < 2;

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
        } else {
            Game.pushTab('Religion');
            Game.popTab();
        }
    }

    // resources

    static getResource(resourceName: ResourceName): Resource {
        return gamePage.resPool.resourceMap[resourceName];
    }

    static getResourcePerTick(resourceName: ResourceName): number {
        return gamePage.getResourcePerTick(resourceName, true);
    }

    static getRace(raceName: RaceName): Race {
        return gamePage.diplomacy.get(raceName);
    }

    static tradeAll(race: Race): void {
        gamePage.diplomacy.tradeAll(race);
    }

    static getCraft(resourceName: ResourceName): Craft {
        return gamePage.workshop.getCraft(resourceName);
    }

    static craft(resourceName: ResourceName, amount: number = 1) {
        gamePage.craft(resourceName, amount);
    }

    static isFull(resourceName: ResourceName): boolean {
        let res = Game.getResource(resourceName);
        return res.value >= res.maxValue * 0.95;
    }

    static haveCapacity(prices: Price[]): boolean {
        for (let cost of prices) {
            var res = Game.getResource(cost.name);
            if (res.maxValue > 0 && cost.val > res.maxValue) {
                return false;
            }
        }

        return true;
    }

    static canAfford(prices: Price[]): boolean {
        for (let cost of prices) {
            if (Game.getResource(cost.name).value < cost.val) {
                return false;
            }
        }

        return true;
    }

    // selecting tabs

    static prevTab: string;

    static pushTab(tabLabel: string) {
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

    static getJob(jobName: JobName): Job {
        return gamePage.village.getJob(jobName);
    }

    static assignJob(job: Job, amount: number = 1): boolean {
        if (job.unlocked) {
            gamePage.village.assignJob(job, amount);
            return true;
        }

        return false;
    }

    static unassignJob(job: Job) {
        if (job.unlocked) {
            gamePage.village.sim.removeJob(job.name);
        }
    }
}

declare const $: any;
declare const gamePage: GamePage;
