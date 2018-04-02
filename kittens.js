// TODO:
// make megalith/ziggurat
// explore for trade
// steamworks, magnetos (oil and energy restrictions)
var k = {
	mode: "on",
	logLevel: 2,
	craftRatio: 1.0,
	msg: '',
	needs: [],
	const: {
		woodPerBeam: 175,
		beamPerScaffold: 50,
		woodPerScaffold: 50 * 175,
		mineralsPerSlab: 250
	},
	buildorder:
	[
		{ label: "Unic. Pasture", name: "" }, 
		{ label: "Hut", name: "hut" },
		{ label: "Log House", name: "logHouse" },
		{ label: "Lumber Mill", name: "lumberMill" }, 
	    { label: "Aqueduct", name: "aqueduct" },
		{ label: "Mine", name: "mine" },
		{ label: "Quarry", name: "quarry" },
		{ label: "Oil Well", name: 'oilWell', prereq: function() { return gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption; } },
		{ label: "Academy", name: "academy" },
		{ label: "Library", name: "library" },
		{ label: "Temple", name: "temple" },
		{ label: "Observatory", name: "observatory" },
		{ label: "Smelter", name: "smelter" },
		{ label: "Calciner", name: "calciner", prereq: function() { return gamePage.getResourcePerTick('oil', true) > 0.05 && gamePage.globalEffectsCached.energyProduction > gamePage.globalEffectsCached.energyConsumption } },
		{ label: "Barn", name: "barn" },
		{ label: "Workshop", name: "workshop" },
		{ label: "Tradepost", name: "tradepost" },
        { label: "Amphitheatre", name: "amphitheatre" },
		{ label: "Aqueduct", name: "aqueduct" },
	],
	craftorder:
	[
		{ raw: "wood", refined: "beam", val: 1 },
		{ raw: "catnip", refined: "wood", val: 10},
		{ raw: "wood", refined: "beam", val: 1 },
		{ raw: "minerals", refined: "slab", val: 1},
		{ raw: "titanium", refined: "alloy", val: 1}
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
	click: function(tab, button) {
		k.pushTab(tab);
		k.log(2, tab + ": " + button.model.metadata.name);
		k.msg += tab + ": " + button.model.metadata.label + "<br/>";
		button.buttonContent.click();
		k.popTab();
	},
	build: function(bldLabel) {
		var bld = $(".btnContent:contains(" + bldLabel + ")");
		if (bld.length == 1 && !bld.parent().hasClass("disabled")) {
			k.log(2, "building " + bldLabel);
			k.msg += "built " + bldLabel + "<br/>";
			bld.click();
		}
    },
    assign: function(job) {
        k.log(1, 'assigning ' + job.name);
        gamePage.village.assignJob(job);
    },
	pushTab: function(tab) {
		k.prevTab = $("a.tab.activeTab")[0].innerText;
		$('a.tab:contains("' + tab + '")')[0].click();
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

		k.build('Catnip field');
		k.build('Catnip field');
		k.build('Catnip field');
		return;
	}

	// TODO: scale k.craftRatio
	
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
            
            var m = gamePage.bld.getPrices('mansion');
            if (m[0].val < gamePage.resPool.resourceMap.slab.value * 0.1 &&
                m[2].val < gamePage.resPool.resourceMap.titanium.maxValue * 0.1)
            {
                k.build('Mansion');
            }

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
	// TODO: unicorn sacrifice
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

    // **********************************************************
    // Calculate needs
    // **********************************************************

    // find affordable buildings
	var bldStr = "now building...<br/>";
	
    k.buildorder.forEach(function(bld) {
		if (bld.name.length == 0) return;
		
		if (bld.name == "smelter" && k.needs.iron == undefined) return;

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

    // hunt and trade
	if (k.isFull("manpower")) {
		// TODO: explore for trading partners
		// TODO: Dragons
		var zebras = gamePage.diplomacy.get('zebras');
		if (zebras !== undefined && zebras.unlocked && gamePage.resPool.resourceMap.gold.value >= 0.75 * gamePage.resPool.resourceMap.gold.maxValue) {
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
			gamePage.craft(craft.refined, craft.val * k.craftRatio);
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
        gamePage.resPool.resourceMap.steel.value >= 0.25 * gamePage.resPool.resourceMap.iron.maxValue)
    {
        k.log(1, 'crafting gear');
        gamePage.craft('gear', 1 * k.craftRatio);
    }

    // TODO: BLOCKER: currently only make parchments for manuscripts.  Early game we need parchment for amphitheaters (for first culture)
    // Amphitheatre isn't on the buildorder list, may need to add
	var fursPerParchment = 175;
    if (k.needs.parchment > 0 && gamePage.resPool.resourceMap.furs.value > fursPerParchment) {
        k.log(1, "crafting parchment");
        gamePage.craftAll("parchment");
    }

	if (k.isFull("culture")) {
		var parchmentsPerManuscript = 25;
		
		if (gamePage.resPool.resourceMap.furs.value >= parchmentsPerManuscript * fursPerParchment) {
			k.log(1, "crafting parchment");
			gamePage.craft("parchment", parchmentsPerManuscript);
		}
		if ($('#k-manuscript-toggle').prop('checked') && 
			gamePage.resPool.resourceMap.parchment.value >= parchmentsPerManuscript) {
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
    var miner = gamePage.village.getJob("miner");
    var scholar = gamePage.village.getJob("scholar");

	if (k.needs.slab) {
		if (!k.needs.minerals) k.needs.minerals = 0;
		k.needs.minerals += k.needs.slab * k.const.mineralsPerSlab;
	}

	if (k.needs.beam) {
		if (!k.needs.wood) k.needs.wood = 0;
		k.needs.wood += k.needs.beam * k.const.woodPerBeam;
	}

	if (k.needs.scaffold) {
		if (!k.needs.wood) k.needs.wood = 0;
		k.needs.wood += k.needs.scaffold * k.const.woodPerScaffold;
	}

    k.needs.tot = 0;
    if (k.needs.wood) k.needs.tot += k.needs.wood;
	if (k.needs.minerals) k.needs.tot += k.needs.minerals;
    if (k.needs.science) k.needs.tot += k.needs.science;
    
    var foodProd = gamePage.getResourcePerTick('catnip', true);
    var woodProd = gamePage.getResourcePerTick('wood', true);
    var mineralsProd = gamePage.getResourcePerTick('minerals', true);
    var scienceProd = gamePage.getResourcePerTick('science', true);

    var productionTotal =  woodProd + mineralsProd + scienceProd;

    var minWorking = 0.1 * gamePage.village.sim.getKittens();

    var foodLow = farmer.unlocked && farmer.value < 2 || (foodProd <= 0 && gamePage.calendar.season < 3);
    var woodLow = woodcutter.unlocked && k.needs.wood / k.needs.tot > woodProd / productionTotal;
    var mineralsLow = miner.unlocked && k.needs.minerals / k.needs.tot > mineralsProd / productionTotal;
    var scienceLow = scholar.unlocked && k.needs.science / k.needs.tot > scienceProd / productionTotal;
	
	$('#k-wood').css('width', ((k.needs.wood / k.needs.tot) * 100) + "%" );
	$('#k-minerals').css('width', ((k.needs.minerals / k.needs.tot) * 100) + "%" );
	$('#k-science').css('width', ((k.needs.science / k.needs.tot) * 100) + "%" );
	
    if (foodLow || woodLow || mineralsLow || scienceLow) {
        // remove if production surplus
        if (woodcutter.value > minWorking &&
            (!k.needs.wood || !woodLow))
        {
            this.game.village.sim.removeJob(woodcutter.name);
        }
        if (miner.value > minWorking &&
            (!k.needs.minerals || !mineralsLow))
        {
            this.game.village.sim.removeJob(miner.name);
        }
        if (scholar.value > minWorking &&
            (!k.needs.science || !scienceLow))
        {
            this.game.village.sim.removeJob(scholar.name);
        }

        // fill up where needed
        while (gamePage.village.getFreeKittens() > 0) {
            if (foodLow) k.assign(farmer);
            else if (woodLow) k.assign(woodcutter);
            else if (mineralsLow) k.assign(miner);
            else if (scienceLow) k.assign(scholar);
        }
    }
	
	$(k.panel).find("#k-msg").html(k.msg);
	$(k.panel).find("#k-bld").html(bldStr);
}, 10000);


$("#kcode").remove();
k.panel = $("<div id='kcode'><div id='mode' /><div id='k-options'>" +
				"<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
				"<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
				"<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
				"</div><div id='k-msg' /><div id='k-bld' />" +
				"<div id='k-needs'><div id='k-wood' class='bar'>wood</div><div id='k-minerals' class='bar'>minerals</div><div id='k-science' class='bar'>science</div></div>" +
				"</div>");
k.panel.append("<style>#kcode { margin-left: 4px; }" +
				"#kcode #mode::before { color: #808080; content: 'mode: ';}" +
				"#kcode #k-msg { margin-top: 5px; }" +
				"#kcode #k-options { margin-top: 5px; }" +
				"#kcode #k-bld { margin-top: 5px; color: #808080; }" +
				"#kcode #k-needs .bar { background-color:#ccc; color:#333 }" +
				"</style>");
$("#leftColumn").append(k.panel);