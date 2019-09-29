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
    static getResource(resourceName) {
        return gamePage.resPool.resourceMap[resourceName];
    }
    static getResourcePerTick(resourceName) {
        return gamePage.getResourcePerTick(resourceName, true);
    }
    static craft(resourceName, amount) {
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
    static get freeKittens() {
        return gamePage.village.getFreeKittens();
    }
    static getJob(jobName) {
        return gamePage.village.getJob(jobName);
    }
    static assignJob(job) {
        if (job.unlocked) {
            gamePage.village.assignJob(job);
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
