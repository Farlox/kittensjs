// TODO:
// explore for trade
// trade ship
// other jobs: hunter, priest
var k = {
    mode: "on",
    logLevel: 2,
    craftRatio: 1.0,
    msg: "",
    needs: [],
    const: {
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
    },
    buildorder:
    [
        { label: "Unic. Pasture", name: "" }, 
        { label: "Hut", name: "hut" },
        { label: "Log House", name: "logHouse" },
        { label: "Mansion", name: "mansion" },
        { label: "Lumber Mill", name: "lumberMill" }, 
        { label: "Mine", name: "mine" },
        { label: "Accelerator", name: "accelerator", prereq: function() { return gamePage.getResourcePerTick('titanium', true) >= 0.014 && gamePage.globalEffectsCached.energyProduction - gamePage.globalEffectsCached.energyConsumption >= 2; } },
        { label: "Reactor", name: "reactor", prereq: function() { return gamePage.getResourcePerTick('uranium', true) >= 0.001; } },
        { label: "Aqueduct", name: "aqueduct" },
        { label: "Catnip field", name: 'field', prereq: function() { return gamePage.calendar.season < 2; } },
        { label: "Pasture", name: 'pasture', prereq: function() { return gamePage.calendar.season < 2; } },
        { label: "Oil Well", name: "oilWell", prereq: function() { return !gamePage.workshop.get('pumpjack').unlocked || gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; } },
        { label: "Bio Lab", name: "biolab" },
        { label: "Academy", name: "academy" },
        { label: "Library", name: "library" },
        { label: "Observatory", name: "observatory" },
        { label: "Temple", name: "temple" },
        { label: "Chapel", name: "chapel" },
        { label: "Smelter", name: "smelter", prereq: function() { return k.needs.iron > 0; } },
        { label: "Calciner", name: "calciner", prereq: function() { return gamePage.getResourcePerTick("oil", true) > 0.024 && gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; } },
        { label: "Magneto", name: "magneto", prereq: function() { return gamePage.getResourcePerTick("oil", true) > 0.05; } },
        { label: "Barn", name: "barn" },
        { label: "Workshop", name: "workshop" },
        { label: "Steamworks", name: "steamworks", prereq: function() { return gamePage.globalEffectsCached.energyProduction - gamePage.globalEffectsCached.energyConsumption < 2; } },
        { label: "Tradepost", name: "tradepost" },
        { label: "Amphitheatre", name: "amphitheatre" },
        { label: "Mint", name: "mint", prereq: function() { return gamePage.getResourcePerTick('furs', true) < 0 || gamePage.getResourcePerTick('ivory', true) < 0; } }
    ],
    bld: {
        unicornPasture: {},
        hut: {},
        logHouse: {},
        mansion: {},
        lumberMill: {},
        mine: {},
        aqueduct: {},
        field: { prereq: function() { return gamePage.calendar.season < 2; } },
        pasture: { prereq: function() { return gamePage.calendar.season < 2; } },
        quarry: {},
        oilWell: { prereq: function() { return !gamePage.workshop.get('pumpjack').unlocked || gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; } },
        biolab: {},
        academy: {},
        library: {},
        observatory: {},
        temple: {},
        chapel: {},
        smelter: { prereq: function() { return k.needs.iron > 0; } },
        calciner: { prereq: function() { return gamePage.getResourcePerTick("oil", true) > 0.05 && gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption } },
        magneto: { prereq: function() { return gamePage.getResourcePerTick("oil", true) > 0.05 } },
        barn: {},
        workshop: {},
        steamworks: { prereq: function() { return gamePage.globalEffectsCached.energyProduction - gamePage.globalEffectsCached.energyConsumption < 2; } },
        tradepost: {},
        amphitheatre: {},
        aqueduct: {}
    },
    craftorder:
    [
        { raw: "wood", refined: "beam", ratio: 175 },
        { raw: "catnip", refined: "wood", ratio: 100 },
        { raw: "wood", refined: "beam", ratio: 175 },
        { raw: "minerals", refined: "slab", ratio: 250 },
        { raw: "titanium", refined: "alloy", ratio: 10 },
        { raw: "oil", refined: "kerosene", ratio: 7500 },
        { raw: "uranium", refined: "thorium", ratio: 250 },
        { raw: "unobtainium", refined: "eludium", ratio: 1000 }
    ],
    isFull: function(resName) {
        return (gamePage.resPool.resourceMap[resName].value / gamePage.resPool.resourceMap[resName].maxValue) >= 0.95
    },
    canAfford: function(prices) {
        var affordable = true;
        prices.forEach(function(cost) {
            if (gamePage.resPool.resourceMap[cost.name].value < cost.val) {
                affordable = false;
            }
        });
        return affordable;
    },
    haveCap: function(prices) {
        var cap = true;
        prices.forEach(function(cost) {
            var res = gamePage.resPool.resourceMap[cost.name];
            if (res.maxValue > 0 && cost.val > res.maxValue) {
                cap = false;
            }
        });
        return cap;
    },
    click: function(tabLabel, button) {
        k.pushTab(tabLabel);
        k.log(2, tabLabel + ": " + button.model.metadata.name);
        k.msg += tabLabel + ": " + button.model.metadata.label + "<br/>";
        button.buttonContent.click();
        k.popTab();
    },
    build: function(bldLabel) {
        var bld = $(".btnContent:contains(" + bldLabel + ")");
        if (bld.length == 1 && !bld.parent().hasClass("disabled")) {
            k.log(2, "building " + bldLabel);
            k.msg += "built " + bldLabel + "<br/>";
            bld.click();
        } else if (bld.length == 2) {
            // HACK: workaround for pasture vs unicorn pasture
            if (bld[0].innerText.substr(0,7) == "Pasture" &&
                !$(bld[0]).parent().hasClass('disabled'))
            {
                k.log(2, "building " + bldLabel);
                k.msg += "built " + bldLabel + "<br/>";
                bld[0].click();
            }
            else if (bld[1].innerText.substr(0,7) == "Pasture" &&
                !$(bld[1]).parent().hasClass('disabled'))
            {
                k.log(2, "building " + bldLabel);
                k.msg += "built " + bldLabel + "<br/>";
                bld[1].click();
            }
        }
    },
    assign: function(job) {
        if (job.unlocked) {
            k.log(1, "assigning " + job.name);
            gamePage.village.assignJob(job);
        }
    },
    unassign: function(job) {
        if (job.unlocked) {
            k.log(1, "unassigning " + job.name);
            gamePage.village.sim.removeJob(job.name);
        }
    },
    pushTab: function(tabLabel) {
        k.prevTab = $("a.tab.activeTab")[0].innerText;
        $('a.tab:contains("' + tabLabel + '")')[0].click();
    },
    popTab: function() {
        $('a.tab:contains("' + k.prevTab + '")')[0].click();
        k.prevTab = null;
    },
    log: function(level, msg) {
        if (level >= k.logLevel) {
            console.log(msg);
        }
    }
};

clearInterval(goi);

var goi = setInterval(function() {
    k.log("scanning... " + new Date().toTimeString());
    k.msg = '';
    
    // **********************************************************
    // INIT mode - beginning of reset
    // **********************************************************
    if (gamePage.bld.get('field').val < 50) {
        $(k.panel).find('#mode').html('INIT');
        $(k.panel).find('#k-msg').html('');

        while (gamePage.bld.getPrices('field')[0].val <= gamePage.resPool.resourceMap.catnip.value)
        {
            k.build('Catnip field');
        }

        return;
    }

    // **********************************************************
    // UI - update ui header
    // **********************************************************
    var d = new Date();
    var mode = "[" + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "] " + k.mode;
    $(k.panel).find("#mode").html(mode);
    
    // **********************************************************
    // always observe the sky
    // **********************************************************
    if ($("input#observeBtn").length == 1) {
        k.msg += "sky observed<br/>";
        k.log(1, "observing the sky");
        $("input#observeBtn").click();
    }

    if (k.mode == "min") {
        k.log(1, "min clicks complete.");
        return;
    }

    // **********************************************************
    // BUILD, RESEARCH, UPGRADE
    // **********************************************************
    // buildings
    if (k.mode != "nobuild") {	
        if ($("a.tab.activeTab")[0].innerText == "Bonfire") {
            k.buildorder.forEach(function(bldId) {
                if (bldId.prereq === undefined || bldId.prereq()) {
                    k.build(bldId.label);
                }
            });
            
            var w = gamePage.bld.getPrices('warehouse');
            if (gamePage.resPool.resourceMap[w[0].name].value * 0.1 > w[0].val &&
                gamePage.resPool.resourceMap[w[1].name].value * 0.1 > w[1].val) {
                k.build('Warehouse');
            }

            var h = gamePage.bld.getPrices('harbor');
            if (gamePage.resPool.resourceMap[h[0].name].value * 0.1 > h[0].val &&
                gamePage.resPool.resourceMap[h[1].name].value * 0.1 > h[1].val &&
                gamePage.resPool.resourceMap[h[2].name].value * 0.1 > h[2].val) {
                k.build('Harbour');
            }

            var q = gamePage.bld.getPrices('quarry');
            if (gamePage.resPool.resourceMap[q[0].name].value * 0.1 > q[0].val &&
                gamePage.resPool.resourceMap[q[1].name].value * 0.1 > q[1].val &&
                gamePage.resPool.resourceMap[q[2].name].value * 0.1 > q[2].val) {
                k.build('Quarry');
            }
        }
    }

    // Workshop improvements
    if (gamePage.workshopTab.visible) {
        gamePage.workshopTab.buttons.forEach(function(btn) {
            if (btn.model.metadata.unlocked &&
                !btn.model.metadata.researched &&
                k.canAfford(btn.model.prices))
                {
                    k.click('Workshop', btn);
                }
        });
    }

    // Science research
    if (gamePage.libraryTab.visible) {
        gamePage.libraryTab.buttons.forEach(function(btn) {
            if (btn.model.metadata.unlocked && 
                !btn.model.metadata.researched &&
                k.canAfford(btn.model.prices))
            {
                k.click('Science', btn);
            }
        });
    }

    // religion
    if (gamePage.religionTab.visible) {
        gamePage.religionTab.rUpgradeButtons.forEach(function(btn) {
            if (btn.model.visible &&
                btn.model.on == 0 &&
                k.canAfford(btn.model.prices))
            {
                k.click('Religion', btn);
            }
        });
    }

    if (k.isFull("faith")) {
        k.log(1, "Praise the sun!");
        gamePage.religionTab.praiseBtn.onClick();
    }

    if (gamePage.religionTab.sacrificeBtn != null &&
        gamePage.religionTab.sacrificeBtn.model.enabled) {
        k.log(1, "Sacrificing Unicorns");
        gamePage.religionTab.sacrificeBtn.onClick();
    }

    // make a ziggurat
    var zigBld = gamePage.bld.get('ziggurat');
    var megalith = gamePage.workshop.getCraft('megalith');

    if (zigBld.val < 1) {
        if (megalith.unlocked &&
            gamePage.resPool.resourceMap.megalith.value < 1 &&
            k.canAfford(megalith.prices))
        {
            gamePage.craft(megalith.name, 1);
        }
        if (zigBld.unlocked) {
            if (k.canAfford(gamePage.bld.getPrices(zigBld.name)))
            {
                k.build(zigBld.label);
            } else {
                if (megalith.unlocked && 
                    gamePage.resPool.resourceMap.megalith.value < 50 && 
                    k.canAfford(megalith.prices))
                {
                    gamePage.craft(megalith.name, 1);
                }
            }
        }
    }

    // **********************************************************
    // Calculate needs
    // **********************************************************

    // find affordable buildings
    var bldStr = "now building...<br/>";
    
    k.buildorder.forEach(function(bld) {
        if (bld.name.length == 0) return;
        
        if (!gamePage.bld.getBuildingExt(bld.name).meta.unlocked) {
            bld.canBuild = false;
            return;
        }
        
        var prices = gamePage.bld.getPrices(bld.name);
        bld.canBuild = true;
        bld.needs = [];
        prices.forEach(function(price) {
            var res = gamePage.resPool.resourceMap[price.name];
            if (res.maxValue > 0 &&
                price.val > res.maxValue) {
                bld.canBuild = false;
            } else if (res.value < price.val) {
                bld.needs.push({
                    name: price.name,
                    gap: price.val - res.value
                });
            }
        });
        
        if (bld.canBuild) {
            bld.needs.sort(function(a,b) { return a.gap > b.gap ? -1 : 1; })
            bldStr += bld.label + ": " + bld.needs.map(function(need) {return need.name + " (" + need.gap.toFixed() + ")";}) + "<br/>";
        }
    });

    // find affordable science research
    k.techs = [];
    gamePage.science.techs.forEach(function(tech) { 
        if (tech.unlocked && 
            !tech.researched &&
            k.haveCap(tech.prices))
            {
            tech.gap = [];
            tech.prices.forEach(function(cost) {
                var res = gamePage.resPool.resourceMap[cost.name];
                if (cost.val > res.value) {
                    tech.gap.push({
                        name: cost.name,
                        affordable: k.canAfford(tech.prices),
                        gap: cost.val - res.value
                    });
                }
            });

            k.techs.push(tech);
        }
    });

    k.upgrades = [];
    gamePage.workshop.upgrades.forEach(function(up) {
        if (up.unlocked &&
            !up.researched &&
            k.haveCap(up.prices))
        {
            up.gap = [];
            up.prices.forEach(function(cost) {
                var res = gamePage.resPool.resourceMap[cost.name];
                if (cost.val > res.value) {
                    up.gap.push({
                        name: cost.name,
                        affordable: k.canAfford(up.prices),
                        gap: cost.val - res.value
                    });
                }
            });

            k.upgrades.push(up);        }
    });
    
    // TODO: add religious upgrades needs

    // calculate aggregate needs
    k.needs = [];
    k.buildorder.forEach(function(b) { 
        if (b.canBuild && b.needs.length > 0) { 
            b.needs.forEach(function(n) { 
                if (k.needs[n.name] == undefined) k.needs[n.name] = 0;
                k.needs[n.name] += n.gap; 
            })
        }
    });
    k.techs.forEach(function(tech) {
        if (tech.gap.length > 0) {
            tech.gap.forEach(function(gap) {
                if (!gap.affordable) {
                    if (k.needs[gap.name] == undefined) k.needs[gap.name] = 0;
                    k.needs[gap.name] += gap.gap;
                }
            });
        }
    });
    k.upgrades.forEach(function(up) {
        if (up.gap.length > 0) {
            up.gap.forEach(function(gap) {
                if (!gap.affordable) {
                    if (k.needs[gap.name] === undefined) k.needs[gap.name] = 0;
                    k.needs[gap.name] += gap.gap;
                }
            });
        }
    });
    // TODO: aggregate religous upgrades needs
    
    // hunt and trade
    if (k.isFull("manpower")) {
        // TODO: explore for trading partners
        // TODO: Dragons
        var zebras = gamePage.diplomacy.get('zebras');
        if (zebras !== undefined && zebras.unlocked && 
            !k.isFull('titanium') &&
            gamePage.resPool.resourceMap.gold.value >= 0.75 * gamePage.resPool.resourceMap.gold.maxValue &&
            gamePage.resPool.resourceMap.slab.value >= 50) {
            k.log(1, "trading with zebras");
            gamePage.diplomacy.tradeAll(zebras);
        } else if (gamePage.resPool.resourceMap.manpower.value >= 100) {
            k.log(1, "hunting");
            gamePage.huntAll({ preventDefault: function() {} });
        }
    }

    // **********************************************************
    // CRAFTING RESOURCES AT CAPACITY
    // **********************************************************
    // TODO: move stuff into k.craftorder
    k.craftorder.forEach(function(craft) {
        if (k.isFull(craft.raw)) {
            k.log(1, "crafting " + craft.refined);

            // amount acquired in 20 seconds
            var seconds = 20;
            var rawAmount = seconds * k.const.ticksPerSecond * gamePage.getResourcePerTick(craft.raw, true);
            var refinedAmount = rawAmount / craft.ratio;
            gamePage.craft(craft.refined, refinedAmount);
        }
    });

    if (k.needs.scaffold > 0 &&
        gamePage.resPool.resourceMap.beam.value > 0.25 * gamePage.resPool.resourceMap.wood.maxValue) {
        k.log(1, "crafting scaffold");

        if ((k.needs.scaffold * k.const.beamPerScaffold / gamePage.resPool.resourceMap.beam.value) < 0.05) {
            gamePage.craft("scaffold", k.needs.scaffold);
        } else {
            var n = (gamePage.resPool.resourceMap.beam.value * 0.05) / k.const.beamPerScaffold;
            gamePage.craft("scaffold", n);
        }
    }

    if (!gamePage.resPool.resourceMap.coal.unlocked) {
        if (k.isFull("iron")) {
            k.log(1, "crafting plates");
            gamePage.craft("plate", 1 * k.craftRatio);
        }
    } else {
        if (k.isFull("coal") || k.isFull("iron")) {
            if (gamePage.resPool.resourceMap.coal.value > 100) {
                k.log(1, "crafting steel");
                gamePage.craftAll("steel");
            } else {
                k.log(1, "crafting plates");
                gamePage.craft("plate", 1 * k.craftRatio);
            }
        }
    }
    
    if (k.needs.gear > 0 &&
        gamePage.resPool.resourceMap.gear.value < 0.1 * gamePage.resPool.resourceMap.steel.value)
    {
        k.log(1, 'crafting gear');
        var gap = 0.1 * gamePage.resPool.resourceMap.steel.value - gamePage.resPool.resourceMap.gear.value
        gamePage.craft('gear', gap / k.const.steelPerGear );
    }

    if (k.needs.concrate > 0 &&
        gamePage.resPool.resourceMap.concrate.value < 0.1 * gamePage.resPool.resourceMap.slab.value &&
        k.canAfford(gamePage.workshop.getCraftPrice(gamePage.workshop.getCraft('concrate'))))
    {
        k.log(1, 'crafting concrete');
        gamePage.craft('concrate', 1);
    }
    
    if (k.needs.alloy > 0 &&
        gamePage.workshop.getCraft('alloy').unlocked &&
        gamePage.resPool.resourceMap.alloy.value < 0.1 * gamePage.resPool.resourceMap.titanium.value)
    {
        k.log(1, 'crafting alloy');
        var gap = 0.1 * gamePage.resPool.resourceMap.titanium.value - gamePage.resPool.resourceMap.alloy.value
        gamePage.craft('alloy', gap / k.const.titaniumPerAlloy );
    }

    if (k.needs.parchment > 0 && gamePage.resPool.resourceMap.furs.value > k.const.fursPerParchment) {
        k.log(1, "crafting parchment");
        gamePage.craftAll("parchment");
    }

    if (k.isFull("culture")) {
        if (gamePage.resPool.resourceMap.furs.value >= k.const.parchmentsPerManuscript * k.const.fursPerParchment) {
            k.log(1, "crafting parchment");
            gamePage.craft("parchment", k.const.parchmentsPerManuscript);
        }
        if ($('#k-manuscript-toggle').prop('checked') && 
            gamePage.resPool.resourceMap.parchment.value >= k.const.parchmentsPerManuscript) {
            k.log(1, "crafting manuscript");
            gamePage.craft("manuscript", 1);
        }
    }
    
    if (k.isFull("science")) {
        if ($('#k-compendium-toggle').prop('checked') &&
            gamePage.resPool.resourceMap.manuscript.value > 50) {
            k.log(1, "crafting compendium");
            gamePage.craft("compedium", 1); // typo intentionally copied from game
        }
        if ($('#k-blueprint-toggle').prop('checked') &&
            gamePage.resPool.resourceMap.compedium.value >= 25) 
        {
            k.log(1, "crafting blueprint");
            gamePage.craft('blueprint', 1);
        }
    }
    
    // **********************************************************
    // Rebalance jobs and ensure no jobless kittens 
    // **********************************************************
    var farmer = gamePage.village.getJob('farmer');

    var woodcutter = gamePage.village.getJob("woodcutter");
    var hunter = gamePage.village.getJob("hunter");
    var miner = gamePage.village.getJob("miner");
    var scholar = gamePage.village.getJob("scholar");
    var geologist = gamePage.village.getJob("geologist");

    // calculate raw needs based on refined needs
    k.needs.totWood = 0;
    if (k.needs.wood) k.needs.totWood += k.needs.wood;
    if (k.needs.beam) k.needs.totWood += k.needs.beam * k.const.woodPerBeam;
    if (k.needs.scaffold) k.needs.totWood += k.needs.scaffold * k.const.woodPerScaffold;

    k.needs.totMinerals = 0;
    if (k.needs.minerals) k.needs.totMinerals += k.needs.minerals;
    if (k.needs.slab) k.needs.totMinerals += k.needs.slab * k.const.mineralsPerSlab;
    if (k.needs.concrate) k.needs.totMinerals += k.needs.concrate * k.const.slabsPerConcrete * k.const.mineralsPerSlab;

    k.needs.totScience = 0;
    if (k.needs.science) k.needs.totScience += k.needs.science;
    if (k.needs.compedium) k.needs.totScience += k.needs.compedium * k.const.sciencePerCompendium;
    if (k.needs.blueprint) k.needs.totScience += (k.needs.blueprint * k.const.compendiumsPerBlueprint * k.const.sciencePerCompendium) +
                                                (k.needs.blueprint * k.const.sciencePerBlueprint);

    if (k.isFull('science')) {
        k.needs.totScience /= 10;
    }

    k.needs.totCoal = 0;
    if (k.needs.steel) k.needs.totCoal += k.needs.steel * k.const.coalPerSteel;
    if (k.needs.gear) k.needs.totCoal += k.needs.gear * k.const.steelPerGear * k.const.coalPerSteel;
    if (k.needs.concrate) k.needs.totCoal += k.needs.concrate * k.const.steelPerConcrete * k.const.coalPerSteel;

    k.needs.totCatpower = 0;
    if (k.needs.parchment) k.needs.totCatpower += k.needs.parchment * k.const.fursPerParchment * k.const.catpowerPerFur;
    if (k.needs.manuscript) k.needs.totCatpower += k.needs.manuscript * k.const.parchmentsPerManuscript * k.const.fursPerParchment * k.const.catpowerPerFur;
    if (k.needs.compedium) k.needs.totCatpower += k.needs.compedium * k.const.manuscriptsPerCompendium * k.const.parchmentsPerManuscript * k.const.fursPerParchment * k.const.catpowerPerFur;
    if (k.needs.blueprint) k.needs.totCatpower += k.needs.blueprint * k.const.compendiumsPerBlueprint * k.const.manuscriptsPerCompendium * k.const.parchmentsPerManuscript * k.const.fursPerParchment * k.const.catpowerPerFur;
    k.needs.totCatpower /= 100;

    k.needs.tot = k.needs.totWood + k.needs.totMinerals + k.needs.totScience + k.needs.totCoal + k.needs.totCatpower;

    var woodProd = gamePage.getResourcePerTick('wood', true);
    var mineralsProd = gamePage.getResourcePerTick('minerals', true);
    var scienceProd = gamePage.getResourcePerTick('science', true);
    var coalProd = gamePage.getResourcePerTick('coal', true);
    var ironProd = gamePage.getResourcePerTick('iron', true);

    var catpowerProd = gamePage.getResourcePerTick('manpower', true);

    var productionTotal = woodProd + mineralsProd + scienceProd + coalProd + catpowerProd;

    var woodNeedRatio = k.needs.totWood / k.needs.tot;
    var mineralsNeedRatio = k.needs.totMinerals / k.needs.tot;
    var scienceNeedRatio = k.needs.totScience / k.needs.tot;
    var coalNeedRatio = k.needs.totCoal / k.needs.tot;
    var catpowerNeedRatio = k.needs.totCatpower / k.needs.tot;

    $('#k-wood').css('width', (isNaN(woodNeedRatio) ? 0 : woodNeedRatio * 100) + "%" );
    $('#k-minerals').css('width', (isNaN(mineralsNeedRatio) ? 0 : mineralsNeedRatio * 100) + "%" );
    $('#k-science').css('width', (isNaN(scienceNeedRatio) ? 0 : scienceNeedRatio * 100) + "%" );
    $('#k-coal').css('width', (isNaN(coalNeedRatio) ? 0 : coalNeedRatio * 100) + "%" );
    $('#k-catpower').css('width', (isNaN(catpowerNeedRatio) ? 0 : catpowerNeedRatio * 100) + "%" );

    var data = [];
    if (woodcutter.unlocked) {
        data.push({
            job: woodcutter, 
            prodRatio: woodProd / productionTotal,
            needRatio: woodNeedRatio
        });
    }
    if (miner.unlocked) {
        data.push({
            job: miner, 
            prodRatio: mineralsProd / productionTotal,
            needRatio: mineralsNeedRatio
        });
    }
    if (scholar.unlocked) {
        data.push({
            job: scholar, 
            prodRatio: scienceProd / productionTotal,
            needRatio: scienceNeedRatio
        });
    }
    if (geologist.unlocked) {
        data.push({
            job: geologist,
            prodRatio: coalProd / productionTotal,
            needRatio: coalNeedRatio
        });
    }
    if (hunter.unlocked) {
        data.push({
            job: hunter,
            prodRatio: catpowerProd / productionTotal,
            needRatio: catpowerNeedRatio
        });
    }

    if (data.length > 1) {
        data.forEach(function(d) {
            if (d.job.name == geologist.name && ironProd < coalProd) {
                d.investWeight = (ironProd - coalProd) / productionTotal;
            } else if (d.job.name == scholar.name && k.isFull('science')) {
                d.investWeight = -d.prodRatio;
            } else {
                d.investWeight = (isNaN(d.needRatio) ? 0 : d.needRatio) - d.prodRatio;
            }
        });

        data.sort(function(a,b) { return a.investWeight - b.investWeight; });

        k.log(1, "\njob production investment weights");
        data.forEach(function(d) { k.log(1, d.job.name + " : " + d.investWeight); });

        var foodProd = gamePage.getResourcePerTick('catnip', true);
        var isFoodProdLow = farmer.unlocked && foodProd <= 0 && gamePage.calendar.season < 3;
    
        // assignment
        if (gamePage.village.getFreeKittens() == 0) k.unassign(data[0].job);
        if (isFoodProdLow) k.assign(farmer);
        else k.assign(data[data.length - 1].job);
    }

    // UI
    $(k.panel).find("#k-msg").html(k.msg);
    $(k.panel).find("#k-bld").html(bldStr);
}, 10000);


$("#kcode").remove();
k.panel = $("<div id='kcode'><div id='mode' /><div id='k-options'>" +
                "<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
                "<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
                "<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
                "</div><div id='k-msg' /><div id='k-bld' />" +
                "<div id='k-needs'><div id='k-wood' class='bar'>wood</div><div id='k-minerals' class='bar'>minerals</div><div id='k-coal' class='bar'>coal</div><div id='k-catpower' class='bar'>catpower</div><div id='k-science' class='bar'>science</div></div>" +
                "</div>");
k.panel.append("<style>#kcode { margin-left: 4px; }" +
                "#kcode #mode::before { color: #808080; content: 'mode: ';}" +
                "#kcode #k-msg { margin-top: 5px; }" +
                "#kcode #k-options { margin-top: 5px; }" +
                "#kcode #k-bld { margin-top: 5px; color: #808080; }" +
                "#kcode #k-needs .bar { background-color:#ccc; color:#333 }" +
                "</style>");
$("#leftColumn").append(k.panel);