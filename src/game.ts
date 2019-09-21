interface Button {
    model: {
        enabled: boolean;
        prices: Price[];
        resourceIsLimited: boolean;
        [key: string]: any;
    };

    opts: {
        name: string; // bonfire
        id: string; // science
    };

    buttonContent: HTMLDivElement;
}

interface Price {
    name: string;
    val: number;
}

interface Tab {
    visible: boolean;
    buttons: Button[];
}

interface Resource {
    name: string;
    craftable: boolean;
    unlocked: boolean;
    value: number;
    maxValue: number;
}

interface GamePage {
    calendar: {
        season: number;
    };

    resPool: any;

    tabs: Tab[];
    libraryTab: Tab;
}

type TabName = 'Bonfire' | 'Science';

class Game {
    static intervalId?: number;

    static isSpringSummer = () => gamePage.calendar.season < 2;

    static get BonfireTab() {
        return gamePage.tabs[0];
    }

    static get ScienceTab() {
        return gamePage.libraryTab;
    }

    static getResource(resourceName: string): Resource {
        return gamePage.resPool.resourceMap[resourceName];
    }

    static isFull(resourceName: string): boolean {
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

    static prevTab: string;

    static pushTab(tabLabel: string) {
        Game.prevTab = $('a.tab.activeTab')[0].innerText;
        $('a.tab:contains("' + tabLabel + '")')[0].click();
    }

    static popTab() {
        $('a.tab:contains("' + Game.prevTab + '")')[0].click();
        Game.prevTab = null;
    }
}

declare const $: any;
declare const gamePage: GamePage;
