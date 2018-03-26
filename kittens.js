// TODO:
// make megalith/ziggurat
// explore for trade

var k = {
	mode: "on",
	logLevel: 2,
	craftRatio: 1.0,
	msg: '',
	needs: [],
	buildorder:
	[
		{ label: "Unic. Pasture", name: "" }, 
		{ label: "Hut", name: "hut" },
		{ label: "Log House", name: "logHouse" },
		{ label: "Lumber Mill", name: "lumberMill" }, 
	    { label: "Aqueduct", name: "aqueduct" },
		{ label: "Mine", name: "mine" },
        { label: "Quarry", name: "quarry" },
		{ label: "Academy", name: "academy" },
		{ label: "Library", name: "library" },
		{ label: "Temple", name: "temple" },
		{ label: "Observatory", name: "observatory" },
		{ label: "Smelter", name: "smelter" },
		{ label: "Barn", name: "barn" },
		{ label: "Workshop", name: "workshop" },
		{ label: "Tradepost", name: "tradepost" },
        { label: "Amphitheatre", name: "amphitheatre" },
		{ label: "Aqueduct", name: "aqueduct" },
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
				k.build(bldId.label);
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
        }
	}

    // Workshop improvements
	if (gamePage.workshopTab.visible) {
		gamePage.workshopTab.buttons.forEach(function(btn) {
			if (btn.model.metadata.unlocked &&
				!btn.model.metadata.researched &&
				k.canAfford(btn.model.prices)) {
					k.pushTab('Workshop');
					k.log(2, 'upgrading ' + btn.model.name);
					k.msg += "upgraded " + btn.model.name + "<br/>";
					btn.buttonContent.click();
					k.popTab();
				}
		});
	}

	// Science research
	if (gamePage.libraryTab.visible) {
		gamePage.libraryTab.buttons.forEach(function(btn) {
			if (btn.model.metadata.unlocked && 
				!btn.model.metadata.researched &&
				k.canAfford(btn.model.prices)) {
				k.pushTab('Science');
				k.log(2, "researching " + btn.model.name);
				k.msg += "researched " + btn.model.name + "<br/>";
				btn.buttonContent.click();
				k.popTab();
			}
		});
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
                    if (k.needs[gap.name] == undefined) k.needs[gap.name] = 0;
                    k.needs[gap.name] += gap.gap;
                }
            });
        }
    });

    // hunt and trade
	if (k.isFull("manpower")) {
		// TODO: remove k.trade in favor of a toggle or logic
		// TODO: explore for trading partners
		if (k.trade) {
			var zebras = gamePage.diplomacy.get('zebras')
			if (zebras != undefined && zebras.unlocked && gamePage.resPool.resourceMap.gold.value >= 15) {
				k.log(1, "trading with zebras");
				gamePage.diplomacy.tradeAll(zebras);
			}
		}
		if (gamePage.resPool.resourceMap.manpower.value >= 100) {
			k.log(1, "hunting");
			gamePage.huntAll({ preventDefault: function(){}})
		}
	}
	
	// religion
	// TODO: claim religious upgrades
	// TODO: unicorn sacrifice
	if (k.isFull("faith")) {
		k.log(1, "Praise the sun!");
		gamePage.religionTab.praiseBtn.onClick();
	}
	
    // **********************************************************
    // 2. CRAFTING
    // **********************************************************
	if (k.isFull("wood")) {
		k.log(1, "crafting beams");
		gamePage.craft("beam", 1 * k.craftRatio);
	}

	if (k.isFull("catnip")) {
		k.log(1, "crafting wood");
		gamePage.craft("wood", 10 * k.craftRatio);
	}

	if (k.isFull("wood")) {
		k.log(1, "crafting beams");
		gamePage.craft("beam", 1 * k.craftRatio);
	}

	if (k.needs.scaffold > 0 &&
		gamePage.resPool.resourceMap.beam.value > gamePage.resPool.resourceMap.wood.maxValue) {
		k.log(1, "crafting scaffold");

		if ((k.needs.scaffold * 50 / gamePage.resPool.resourceMap.beam.value) < 0.05) {
			gamePage.craft("scaffold", k.needs.scaffold);
		} else {
			var n = (gamePage.resPool.resourceMap.beam.value * 0.05) / 50;
			gamePage.craft("scaffold", n)
		}
	}

	if (k.isFull("minerals")) {
		k.log(1, "crafting slabs");
		gamePage.craft("slab", 1 * k.craftRatio);
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
				gamePage.craftAll("steel")
			} else {
				k.log(1, "crafting plates");
				gamePage.craft("plate", 1 * k.craftRatio);
			}
		}
    }
    
    if (k.needs.gear > 0 &&
        gamePage.resPool.resourceMap.steel.value >= 0.5 * gamePage.resPool.resourceMap.iron.maxValue)
    {
        k.log(1, 'crafting gear');
        gamePage.craft('gear', 1 * k.craftRatio);
    }

    // TODO: BLOCKER: currently only make parchments for manuscripts.  Early game we need parchment for amphitheaters (for first culture)
    // Amphitheatre isn't on the buildorder list, may need to add
    if (k.needs.parchment > 0 && gamePage.resPool.resourceMap.furs.value > 525) {
        k.log(1, "crafting parchment");
        gamePage.craftAll("parchment");
    }

	if (k.isFull("culture")) {
		var fursPerParchment = 175;
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

	if (k.isFull("titanium") &&
	    $('#k-alloy-toggle').prop('checked')) {
		k.log(1, "crafting alloy");
		gamePage.craft("alloy", 1);
	}
	
    // **********************************************************
    // Rebalance jobs and ensure no jobless kittens 
    // **********************************************************
    var farmer = gamePage.village.getJob('farmer');

    var woodcutter = gamePage.village.getJob("woodcutter");
    var miner = gamePage.village.getJob("miner");
    var scholar = gamePage.village.getJob("scholar");
    var jobTot = woodcutter.value + miner.value + scholar.value;

    k.needs.tot = 0;
    if (k.needs.wood) k.needs.tot += k.needs.wood;
    if (k.needs.minerals) k.needs.tot += k.needs.minerals;
    if (k.needs.science) k.needs.tot += k.needs.science;
    
    var productionTotal = gamePage.resPool.resourceMap.wood.perTickCached +
                          gamePage.resPool.resourceMap.minerals.perTickCached +
                          gamePage.resPool.resourceMap.science.perTickCached;

    var minWorking = 0.1 * gamePage.village.sim.getKittens();

    var woodLow = k.needs.wood / k.needs.tot > gamePage.resPool.resourceMap.wood.perTickCached / productionTotal;
    var mineralsLow = k.needs.minerals / k.needs.tot > gamePage.resPool.resourceMap.minerals.perTickCached / productionTotal;
    var scienceLow = k.needs.science / k.needs.tot > gamePage.resPool.resourceMap.science.perTickCached / productionTotal;

    if (woodLow || mineralsLow || scienceLow) {
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
            if (farmer.value < 2 || (gamePage.resPool.resourceMap.catnip.perTickCached <= 0 && gamePage.calendar.season < 3)) {
                k.assign(farmer);
            } else if (woodLow) {
                k.assign(woodcutter);
            } else if (mineralsLow) {
                k.assign(miner);
            } else if (scienceLow) {
                k.assign(scholar);
            }
        }
    }
	
	$(k.panel).find("#k-msg").html(k.msg);
	$(k.panel).find("#k-bld").html(bldStr);
}, 10000);


$("#kcode").remove();
k.panel = $("<div id='kcode'><div id='mode' /><div id='k-options'>" +
				"<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' checked /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
				"<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' checked /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
				"<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' checked /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
				"<input id='k-alloy-toggle' name='k-alloy-toggle' type='checkbox' checked /><label for='k-alloy-toggle'>make alloy</label>" +
				"</div><div id='k-msg' /><div id='k-bld' /></div>");
k.panel.append("<style>#kcode { margin-left: 4px; }" +
				"#kcode #mode::before { color: #808080; content: 'mode: ';}" +
				"#kcode #k-msg { margin-top: 5px; }" +
				"#kcode #k-options { margin-top: 5px; }" +
				"#kcode #k-bld { margin-top: 5px; color: #808080; }" +
				"</style>");
$("#leftColumn").append(k.panel);