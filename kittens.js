var k = {
	mode: "on",
	craftRatio: 10.0,
	buildorder:
	[
		{ label: "Unic. Pasture", name: "" }, 
		{ label: "Hut", name: "hut" },
		{ label: "Log House", name: "logHouse" },
		{ label: "Lumber Mill", name: "lumberMill" }, 
	    { label: "Aqueduct", name: "aqueduct" },
		{ label: "Mine", name: "mine" },
//      { label: "Quarry", name: "quarry" },
		{ label: "Academy", name: "academy" },
		{ label: "Library", name: "library" },
		{ label: "Temple", name: "temple" },
		{ label: "Observatory", name: "observatory" },
		{ label: "Smelter", name: "smelter" },
//		{ label: "Warehouse", name: "warehouse" },
		{ label: "Barn", name: "barn" },
		{ label: "Workshop", name: "workshop" },
		{ label: "Tradepost", name: "tradepost" },
//      { label: "Amphitheatre", name: "amphitheatre" },
		{ label: "Aqueduct", name: "aqueduct" },
	],
	isFull: function(resName) {
		return (gamePage.resPool.resourceMap[resName].value / gamePage.resPool.resourceMap[resName].maxValue) >= 0.95
	}
};

clearInterval(goi);

var goi = setInterval(function() {
	console.log("scanning... " + new Date().toTimeString());

	// update ui
	var d = new Date();
	$(k.panel).find("#mode").text("[" + d.getHours() + ":" + d.getMinutes() + ":" + ("0" + d.getSeconds()).slice(-2) + "] " + k.mode);

	if (k.mode == "off") {
		console.log("...disabled");
		return;
	}
    
	// always observe the sky
	if ($("input#observeBtn").length == 1) {
		console.log("observing the sky");
		$("input#observeBtn").click();
	}

    if (k.mode == "min") {
		console.log("min clicks complete.");
		return;
	}

    if (k.mode != "nobuild") {	
		// buildings
		if ($("a.tab.activeTab")[0].innerText == "Bonfire") {
			k.buildorder.forEach(function(bldId) {
				var bld = $(".btnContent:contains(" + bldId.label + ")");
				if (bld.length == 1 && !bld.parent().hasClass("disabled")) {
					console.log("building " + bldId.label);
					bld.click();
				}
			});
		}
	}

	// TODO: toggle to trade with zebras for titanium
    // hunt
	if (k.isFull("catpower") {
		console.log("hunting");
		gamePage.huntAll({ preventDefault: function(){}})
	}

	// religion
	if (k.isFull("faith")) {
		console.log("Praise the sun!");
		gamePage.religionTab.praiseBtn.onClick();
	}
	
	// crafting
	if (k.isFull("wood")) {
		console.log("crafting beams");
		gamePage.craft("beam", 1 * k.craftRatio);
	}

	if (k.isFull("catnip")) {
		console.log("crafting wood");
		gamePage.craft("wood", 10 * k.craftRatio);
	}

	if (k.isFull("wood")) {
		console.log("crafting beams");
		gamePage.craft("beam", 1 * k.craftRatio);
	}

	if (k.isFull("minerals")) {
		console.log("crafting slabs");
		gamePage.craft("slab", 1 * k.craftRatio);
	}

	if (!gamePage.resPool.resourceMap.coal.unlocked) {
		if (k.isFull("iron")) {
			console.log("crafting plates");
			gamePage.craft("plate", 1 * k.craftRatio);
		}
	} else {
		if (k.isFull("coal") || k.isFull("iron")) {
			if (gamePage.resPool.resourceMap.coal.value > 100) {
				console.log("crafting steel");
				gamePage.craftAll("steel")
			} else {
				console.log("crafting plates");
				gamePage.craft("plate", 1 * k.craftRatio);
			}
		}
	}
	
	// TODO: currently only make parchments for manuscripts.  Early game we need parchment for amphitheaters (for first culture)
	
	if (k.isFull("culture")) {
		var fursPerParchment = 175;
		var parchmentsPerManuscript = 25;
		
		if (gamePage.resPool.resourceMap.furs.value >= parchmentsPerManuscript * fursPerParchment) {
			console.log("crafting parchment");
			gamePage.craft("parchment", furs);
		}
		if (!k.needparchment && 
			gamePage.resPool.resourceMap.parchment.value >= parchmentsPerManuscript) {
			console.log("crafting manuscript");
			gamePage.craft("manuscript", 1);
		}
	}
	
	if (k.isFull("science") && 
	    gamePage.resPool.resourceMap.manuscript.value > 50 &&
		!k.needmanuscript) {
		console.log("crafting compendium");
		gamePage.craft("compedium", 1); // typo intentionally copied from game
	}
	
	if (k.isFull("titanium" &&
	    !k.needsteel) {
		console.log("crafting alloy");
		gamePage.craft("alloy", 1);
	}
	
	// update ui
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

	// TODO: Assign jobs to jobless kittens
	// TODO: workshop improvements
	// TODO: Science upgrades
	
	$(k.panel).find("#k-bld").html(bldStr);
}, 10000);


$("#kcode").remove();
k.panel = $("<div id='kcode'><div id='mode' /><div id='k-msg' /><div id='k-bld' /></div>");
k.panel.append("<style>#kcode { margin-left: 4px; }" +
				"#kcode #mode::before { color: #808080; content: 'mode: ';}" +
				"#kcode #k-bld { margin-top: 5px; color: #808080; }" +
				"</style>");
$("#leftColumn").append(k.panel);
