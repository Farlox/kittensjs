var $;
var Game = (function () {
    function Game() {
    }
    Game.isSpringSummer = function () { return gamePage.calendar.season < 2; };
    Game.isWinter = function () { return gamePage.calendar.season == 3; };
    Game.getResourcePerTick = function (resourceName) { return gamePage.getResourcePerTick(resourceName, true); };
    Game.getResource = function (resourceName) { return gamePage.resPool.resourceMap[resourceName]; };
    Game.getCraft = function (resourceName) {
        return gamePage.workshop.getCraft(resourceName);
    };
    Game.craft = function (resourceName, val) {
        gamePage.craft(resourceName, val);
    };
    Object.defineProperty(Game, "freeKittens", {
        get: function () { return gamePage.village.getFreeKittens(); },
        enumerable: true,
        configurable: true
    });
    Game.getJob = function (jobName) { return gamePage.village.getJob(jobName); };
    Game.assignJob = function (job) {
        if (job.unlocked) {
            gamePage.village.assignJob(job);
            return true;
        }
        return false;
    };
    Game.unassignJob = function (job) {
        if (job.unlocked) {
            gamePage.village.sim.removeJob(job.name);
        }
    };
    Game.pushTab = function (tabLabel) {
        Game.prevTab = $("a.tab.activeTab")[0].innerText;
        $('a.tab:contains("' + tabLabel + '")')[0].click();
    };
    Game.popTab = function () {
        $('a.tab:contains("' + Game.prevTab + '")')[0].click();
        Game.prevTab = null;
    };
    Object.defineProperty(Game, "BonfireTab", {
        get: function () { return gamePage.tabs[0]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "WorkshopTab", {
        get: function () { return gamePage.workshopTab; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "ScienceTab", {
        get: function () { return gamePage.libraryTab; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "SpaceTab", {
        get: function () { return gamePage.spaceTab; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "EnergyProduction", {
        get: function () { return gamePage.globalEffectsCached.energyProduction; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "EnergyConsumption", {
        get: function () { return gamePage.globalEffectsCached.energyConsumption; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Game, "NetEnergy", {
        get: function () { return Game.EnergyProduction - Game.EnergyConsumption; },
        enumerable: true,
        configurable: true
    });
    return Game;
}());
Game.const = {
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
    catpowerPerFur: 1,
    fursPerParchment: 175,
    parchmentsPerManuscript: 25,
    manuscriptsPerCompendium: 50,
    sciencePerCompendium: 10000,
    compendiumsPerBlueprint: 25,
    sciencePerBlueprint: 25000
};
