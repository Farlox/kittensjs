export declare const $: any;
export declare const gamePage: GamePage;

export class Game {
  static const = {
    ticksPerSecond: 5,
    woodPerBeam: 175,
    beamPerScaffold: 50,
    woodPerScaffold: 50 * 175,
    mineralsPerSlab: 250,
    slabsPerConcrete: 2500,
    steelPerConcrete: 25,
    iconPerSteel: 100,
    coalPerSteel: 100,
    steelPerGear: 15,
    titaniumPerAlloy: 10,
    catpowerPerFur: 1, // 100 catpower per hunt, TODO: ~30-170 furs per hunt depending on upgrades
    fursPerParchment: 175,
    parchmentsPerManuscript: 25,
    manuscriptsPerCompendium: 50,
    sciencePerCompendium: 10000,
    compendiumsPerBlueprint: 25,
    sciencePerBlueprint: 25000
  };

  static isSpringSummer() {
    return gamePage.calendar.season < 2;
  }
  static isWinter() {
    return gamePage.calendar.season == 3;
  }

  static getResourcePerTick(resourceName: string) {
    return gamePage.getResourcePerTick(resourceName, true);
  }
  static getResource(resourceName: string): Resource {
    return gamePage.resPool.resourceMap[resourceName];
  }

  static getCraft(resourceName: string): Craft {
    return gamePage.workshop.getCraft(resourceName);
  }

  static craft(resourceName: string, val: number) {
    gamePage.craft(resourceName, val);
  }

  static get freeKittens() {
    return gamePage.village.getFreeKittens();
  }
  static getJob(jobName: string) {
    return gamePage.village.getJob(jobName);
  }
  static assignJob(job: Job): boolean {
    if (job.unlocked) {
      gamePage.village.assignJob(job);
      return true;
    }

    return false;
  }
  static unassignJob(job: Job) {
    if (job.unlocked) {
      gamePage.village.sim.removeJob(job.name);
    }
  }

  static prevTab: string;

  static pushTab(tabLabel: string) {
    Game.prevTab = $("a.tab.activeTab")[0].innerText;
    $('a.tab:contains("' + tabLabel + '")')[0].click();
  }

  static popTab() {
    $('a.tab:contains("' + Game.prevTab + '")')[0].click();
    Game.prevTab = null;
  }

  static get BonfireTab() {
    return gamePage.tabs[0];
  }
  static get WorkshopTab() {
    return gamePage.workshopTab;
  }
  static get ScienceTab() {
    return gamePage.libraryTab;
  }
  static get SpaceTab() {
    return gamePage.spaceTab;
  }

  static get EnergyProduction() {
    return gamePage.globalEffectsCached.energyProduction;
  }
  static get EnergyConsumption() {
    return gamePage.globalEffectsCached.energyConsumption;
  }
  static get NetEnergy() {
    return Game.EnergyProduction - Game.EnergyConsumption;
  }
}

interface GamePage {
  workshop: {
    get(upgradeName: string);
    getCraft(craftName: string): Craft;
  };

  resPool: any;

  craft(resourceName: string, val: number);

  globalEffectsCached: {
    energyProduction: number;
    energyConsumption: number;
  };

  bld: {
    get(bldName: string);
    getPrices(bldName: string): Price[];
  };

  calendar: {
    season: number;
  };

  village: {
    getJob(jobName: string);
    assignJob(job: Job);
    getFreeKittens(): number;
    sim: {
      removeJob(jobName: string);
    };
  };

  tabs: Tab[];
  workshopTab: Tab;
  libraryTab: Tab;
  spaceTab: SpaceTab;

  science: any;

  getResourcePerTick(resName: string, alwaysTrue: boolean): number;
}

export interface Tab {
  visible: boolean;
  buttons: Button[];
}

export interface SpaceTab extends Tab {
  planetPanels: any[];
}

export interface Button {
  model: any;
  buttonContent: HTMLDivElement;
}

export interface Craft {
  prices: Price[];
}

export interface Resource {
  name: string;
  craftable: boolean;
  unlocked: boolean;
  value: number;
  maxValue: number;
}

export interface Price {
  name: string;
  val: number;
}

export interface Job {
  name: string;
  unlocked: boolean;
}
