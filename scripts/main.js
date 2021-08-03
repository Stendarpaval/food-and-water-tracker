const MODULE = "food-and-water-tracker";

Hooks.on("init", () => {
	// set character flags in dnd5e's Special Traits application
	CONFIG.DND5E.characterFlags["trackFoodAndwater"] = {
		name: "FWT.trackFoodAndWater",
		hint: "FWT.trackFoodAndWaterHint",
		section: "FWT.foodAndWaterSection",
		type: Boolean
	};

	CONFIG.DND5E.characterFlags["DaysWithoutFood"] = {
		name: "FWT.daysWithoutFood",
		hint: "FWT.daysWithoutFoodHint",
		section: "FWT.foodAndWaterSection",
		type: Number,
		placeholder: 0
	}

	CONFIG.DND5E.characterFlags["customFoodLimit"] = {
		name: "FWT.customFoodLimit",
		hint: "FWT.customFoodLimitHint",
		section: "FWT.foodAndWaterSection",
		type: Number,
		placeholder: 3
	}

	CONFIG.DND5E.characterFlags["DaysWithoutWater"] = {
		name: "FWT.daysWithoutWater",
		hint: "FWT.daysWithoutWaterHint",
		section: "FWT.foodAndWaterSection",
		type: Number,
		placeholder: 0
	}

	CONFIG.DND5E.characterFlags["customWaterLimit"] = {
		name: "FWT.customWaterMinimum",
		hint: "FWT.customWaterMinimumHint",
		section: "FWT.foodAndWaterSection",
		type: Number,
		placeholder: 1
	}

	// register settings
	game.settings.register(MODULE,"relevantRestTypes", {
		name: "SETTINGS.FWT.relevantRestTypes",
		hint: "SETTINGS.FWT.relevantRestTypesHint",
		config: true,
		scope: "world",
		default: 1,
		type: Number,
		choices: {
			0: "FWT.shortRests",
			1: "FWT.longRests",
			2: "FWT.shortAndLongRests"
		}
	});

	game.settings.register(MODULE,"thirstSaveDC", {
		name: "SETTINGS.FWT.thirstSaveDC",
		hint: "SETTINGS.FWT.thirstSaveDCHint",
		config: true,
		scope: "world",
		default: 15,
		type: Number
	});

	game.settings.register(MODULE,"hotWeather", {
		name: "SETTINGS.FWT.hotWeather",
		hint: "SETTINGS.FWT.hotWeatherHint",
		config: true,
		default: false,
		scope: "world",
		type: Boolean
	});

	game.settings.register(MODULE,"showMaxWaterDays", {
		name: "SETTINGS.FWT.showMaxWaterDays",
		hint: "SETTINGS.FWT.showMaxWaterDaysHint",
		config: true,
		default: false,
		scope: "world",
		type: Boolean
	});

	game.settings.register(MODULE,"useCustomFWRules", {
		name: "SETTINGS.FWT.useCustomFWRules",
		hint: "SETTINGS.FWT.useCustomFWRulesHint",
		config: true,
		default: false,
		scope: "world",
		type: Boolean
	});

	game.settings.register(MODULE,"customFoodRuleText", {
		name: "SETTINGS.FWT.customFoodRuleText",
		hint: "SETTINGS.FWT.customFoodRuleTextHint",
		config: true,
		default: "You need to eat at least 1 lb of food each day.",
		scope: "world",
		type: String
	});

	game.settings.register(MODULE,"customWaterRuleText", {
		name: "SETTINGS.FWT.customWaterRuleText",
		hint: "SETTINGS.FWT.customWaterRuleTextHint",
		config: true,
		default: "You need to drink at least 1 gallon of water each day.",
		scope: "world",
		type: String
	});

	game.settings.register(MODULE,"listConsumableFood", {
		name: "SETTINGS.FWT.listConsumableFood",
		hint: "SETTINGS.FWT.listConsumableFoodHint",
		config: true,
		default: false,
		scope: "world",
		type: Boolean
	});

	game.settings.register(MODULE,"listWaterContainers", {
		name: "SETTINGS.FWT.listWaterContainers",
		hint: "SETTINGS.FWT.listWaterContainersHint",
		config: true,
		default: false,
		scope: "world",
		type: Boolean
	});

	game.settings.register(MODULE,"waterContainerCapacities", {
		name: "SETTINGS.FWT.waterContainerCapacities",
		hint: "SETTINGS.FWT.waterContainerCapacitiesHint",
		config: true,
		default: "Waterskin:8",
		scope: "world",
		type: String
	});
});


// standard checks for each hook
function isTrackingEnabled(args) {
	if (typeof args.actor === "undefined") return false;
	if (typeof args.actor.data.flags.dnd5e === "undefined") return false;
	if (!args.actor.data.flags.dnd5e.trackFoodAndwater) return false;
	return true;
}


// Hook into rest dialogs
Hooks.on("renderShortRestDialog", async (args, html) => {
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 1) return;

	const data = await getFWData(args.actor);
	const foodWaterOptions = await renderTemplate('modules/food-and-water-tracker/templates/track-food-water.html', data);
	html.css({height: 'auto'}).find('div[class="dialog-buttons"]').before(foodWaterOptions);
});

Hooks.on("renderLongRestDialog", async (args, html) => {
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 0) return;

	const data = await getFWData(args.actor);
	let foodWaterOptions = await renderTemplate('modules/food-and-water-tracker/templates/track-food-water.html', data);
	html.css({height: 'auto'}).find('div[class="dialog-buttons"]').before(foodWaterOptions);
});

Hooks.on("closeShortRestDialog", async (args, html) => {
	if (event.target.dataset.button !== "rest") return;
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 1) return;
	
	await trackFoodAndWater(args, html);
});

Hooks.on("closeLongRestDialog", async (args, html) => {
	if (event.target.dataset.button !== "rest") return;
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 0) return;
	
	await trackFoodAndWater(args, html);
});



// for compatibility with FVTT-Long-Rest-HD-Healing-5e
Hooks.on("renderHDLongRestDialog", async (args, html) => {
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 0) return;

	const data = await getFWData(args.actor);
	let foodWaterOptions = await renderTemplate('modules/food-and-water-tracker/templates/track-food-water.html', data);
	html.css({height: 'auto'}).find('div[class="dialog-buttons"]').before(foodWaterOptions);
});

Hooks.on("closeHDLongRestDialog", async (args, html) => {
	if (event.target.dataset.button !== "rest") return;
	if (!isTrackingEnabled(args)) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 0) return;
	
	await trackFoodAndWater(args, html);
});



// process the food and water tracking input
async function trackFoodAndWater(args, html) {
	const data = await getFWData(args.actor);
	const listFoodItemOptions = game.settings.get(MODULE, "listConsumableFood");

	let foodQuantity = "";
	if (listFoodItemOptions) {
		let foodId = html.find('.foodQuantity')[0].value;
		if (foodId === "none") {
			foodQuantity = "none";
		} else if (foodId ==="onePoundOrMore") {
			foodQuantity = "onePoundOrMore";
		} else {
			if (args.actor.items.get(foodId)) {
				let foodItem = args.actor.items.get(foodId);
				if (foodItem.data.data?.weight >= 1) {
					foodQuantity = "onePoundOrMore";
				} else if (foodItem.data.data?.weight >= 0.5 && foodItem.data.data?.weight < 1) {
					foodQuantity = "halfPound";
				} else {
					foodQuantity = "none";
				}
				if (foodItem.data.data?.quantity > 1) {
					await foodItem.update({"data.quantity": foodItem.data.data?.quantity - 1})
				} else if (foodItem.data.data?.quantity <= 1) {
					await foodItem.delete();
				}
			}	
		}
	} else {
		foodQuantity = html.find('.foodQuantity')[0].value;
	}
	if (foodQuantity === "onePoundOrMore") {
		console.log(MODULE + " | Resetting `DaysWithoutFood` variable to 0.")
		await args.actor.setFlag("dnd5e", "DaysWithoutFood", 0);
	} else if (foodQuantity === "halfPound") {
		await args.actor.setFlag("dnd5e", "DaysWithoutFood", data.noFoodDays + 0.5);
		if (game.settings.get(MODULE,"useCustomFWRules")) return;
		if (data.noFoodDays + 0.5 >= data.maxFoodDays + 1) {
			ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyHunger", {actorName: args.actor.name}));
			await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 1});
		}
	} else {
		await args.actor.setFlag("dnd5e", "DaysWithoutFood", data.noFoodDays + 1);
		if (game.settings.get(MODULE,"useCustomFWRules")) return;
		if (data.noFoodDays + 1 > data.maxFoodDays) {
			ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyHunger", {actorName: args.actor.name}));
			await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 1});
		}
	}

	const listWaterContainers = game.settings.get(MODULE, "listWaterContainers");
	let waterQuantity = "";
	if (listWaterContainers) {
		let waterId = html.find('.waterQuantity')[0].value;
		if (waterId === "lessThanRequiredWater") {
			waterQuantity = "lessThanRequiredWater";
		} else if (waterId === "moreThanRequiredWater") {
			waterQuantity = "moreThanRequiredWater";
		} else {
			if (args.actor.items.get(waterId)) {
				let waterContainers = [];
				let waterContainerCapacities = game.settings.get(MODULE, "waterContainerCapacities").split(";").filter((container) => {
					return container !== "";
				});
				for (let containerCap of waterContainerCapacities) {
					let containerSpec = containerCap.split(":").filter((c) => {
						return c !== "";
					})
					waterContainers.push({name: containerSpec[0], chargesPerGallon: containerSpec[1]});
				}
				let waterItem = args.actor.items.get(waterId);
				let waterItems = args.actor.items.filter(i => i.name === waterItem.name);
				let totalCharges = 0;
				for (let item of waterItems) {
					totalCharges += item.data.data.uses.value + (item.data.data.quantity - 1) * item.data.data.uses.max;
				}
				let chargesPerGallon = waterContainers.filter(c => c.name === waterItem.name)[0]?.chargesPerGallon;
				if (totalCharges - (game.settings.get(MODULE,"hotWeather") ? 2 : 1) * chargesPerGallon >= 0) {
					waterQuantity = "moreThanRequiredWater";
					let chargesToRemove = (game.settings.get(MODULE,"hotWeather") ? 2 : 1) * chargesPerGallon;
					await removeWaterContainerCharges(chargesToRemove, waterItems);
				} else if (totalCharges - (game.settings.get(MODULE,"hotWeather") ? 1 : 0.5) * chargesPerGallon >= 0) {
					waterQuantity = "requiredWater";
					let chargesToRemove = (game.settings.get(MODULE,"hotWeather") ? 1 : 0.5) * chargesPerGallon;
					await removeWaterContainerCharges(chargesToRemove, waterItems);
				} else {
					waterQuantity = "lessThanRequiredWater";
					await removeWaterContainerCharges(totalCharges, waterItems);
				}
			}
		}
	} else {
		waterQuantity = html.find('.waterQuantity')[0].value;	
	}
	
	if (waterQuantity === "moreThanRequiredWater") {
		await args.actor.setFlag("dnd5e", "DaysWithoutWater", 0);
	} else if (waterQuantity === "requiredWater") {
		await args.actor.setFlag("dnd5e", "DaysWithoutWater", data.noWaterDays + 0.5);
		if (game.settings.get(MODULE,"useCustomFWRules")) return;
		if (args.actor.data.data.attributes.exhaustion !== 0) {
			ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyDehydration", {actorName: args.actor.name}));
			await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 2});
		} else {
			let conSave = await new Promise((resolve) => {
				const conSaveResult = args.actor.rollAbilitySave("con",{flavor: game.i18n.format("FWT.conSaveFlavor", {thirstSaveDC: game.settings.get(MODULE,"thirstSaveDC")})});
				resolve(conSaveResult);
			})
			
			if (conSave.total < game.settings.get(MODULE,"thirstSaveDC")) {
				ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyThirst", {actorName: args.actor.name}));
				await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 1});
			}
		}
	} else {
		await args.actor.setFlag("dnd5e","DaysWithoutWater",data.noWaterDays + 1);
		if (game.settings.get(MODULE,"useCustomFWRules")) return;
		if (args.actor.data.data.attributes.exhaustion !== 0) {
			ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyDehydration", {actorName: args.actor.name}));
			await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 2});
		} else {
			ui.notifications.info(game.i18n.format("FWT.exhaustionNotifyThirst", {actorName: args.actor.name}));
			await args.actor.update({"data.attributes.exhaustion": args.actor.data.data.attributes.exhaustion + 1});
		}
	}
}


// remove charges from water container items like waterskins
async function removeWaterContainerCharges(chargesToRemove, waterItems) {
	for (let item of waterItems) {
		if (item.data.data.uses.value < chargesToRemove) {
			chargesToRemove -= item.data.data.uses.value;
			if (item.data.data.quantity > 1) {
				let newQuantity = item.data.data.quantity - 1;
				let remainingCharges = item.data.data.uses.max;
				for (let i = 0; i < item.data.data.quantity; i++) {
					chargesToRemove -= item.data.data.uses.max;
					newQuantity--;
					if (chargesToRemove <= 0 || newQuantity < 1) {
						remainingCharges = Math.abs(chargesToRemove);
						newQuantity++;
						break;
					}
				}
				await item.data.document.update({'data.uses.value': remainingCharges, 'data.quantity': newQuantity});
			} else {
				await item.data.document.update({'data.uses.value': 0});	
			}
		} else {
			await item.data.document.update({'data.uses.value': item.data.data.uses.value - chargesToRemove});
			chargesToRemove -= item.data.data.uses.value;
		}
		
		if (chargesToRemove <= 0) {
			break;
		}
	}
}


// collect food and water tracking data from an actor
async function getFWData(consumerActor) {
	const defaultFlagValues = {
		"DaysWithoutFood": 0,
		"customFoodLimit": 0,
		"DaysWithoutWater": 0,
		"customWaterLimit": 0
	};

	for ( let [key, value] of Object.entries(defaultFlagValues) ) {
		if (typeof consumerActor.data.flags.dnd5e[key] === "undefined") {
			console.log(MODULE + " | Setting default food and water flag values.");
			await consumerActor.setFlag("dnd5e", key, value);
		}
	}

	const conMod = Math.floor((consumerActor.data.data.abilities.con.value - 10) / 2);
	const maxFoodDays = ((consumerActor.data.flags.dnd5e.customFoodLimit === 0) ? 3 + conMod : consumerActor.data.flags.dnd5e.customFoodLimit);
	const noFoodDays = consumerActor.getFlag("dnd5e","DaysWithoutFood");

	const maxWaterDays = ((consumerActor.data.flags.dnd5e.customWaterLimit == 0) ? 1 : consumerActor.data.flags.dnd5e.customWaterLimit);
	const noWaterDays = consumerActor.getFlag("dnd5e","DaysWithoutWater");
	const reqWater = (game.settings.get(MODULE,"hotWeather") ? 2 : 1);
	const halfReqWater = reqWater / 2;
	const pluralGallons = reqWater > 1;
	const halfPluralGallons = halfReqWater > 1;

	const showMaxWaterDays = game.settings.get(MODULE,"showMaxWaterDays");

	let showSRDrules = true, showCustomRules = false;
	if (game.settings.get(MODULE,"useCustomFWRules")) {
		showSRDrules = false, showCustomRules = true;
	}
	const customFoodRuleText = game.settings.get(MODULE, "customFoodRuleText");
	const customWaterRuleText = game.settings.get(MODULE, "customWaterRuleText");

	const listFoodItemOptions = game.settings.get(MODULE, "listConsumableFood");
	let foodList = [];
	if (listFoodItemOptions) {
		let foodItems = consumerActor.items.filter(i => i.data.data?.consumableType === "food");
		for (let food of foodItems) {
			foodList.push({name: `${food.name} (${food.data.data?.quantity}) (${food.data.data?.weight} lbs${(food.data.data?.quantity > 1) ? ` each` : ``})`, id: food.id, weight: food.data.data?.weight ?? 0});
		}
	}

	const listWaterContainers = game.settings.get(MODULE, "listWaterContainers");
	let waterList = [];
	if (listWaterContainers) {
		let waterContainerCapacities = game.settings.get(MODULE, "waterContainerCapacities").split(";").filter((container) => {
			return container !== "";
		});
		for (let containerCap of waterContainerCapacities) {
			let containerSpec = containerCap.split(":").filter((c) => {
				return c !== "";
			})
			let items = consumerActor.items.filter(i => (i.name === containerSpec[0] && i.data.data?.uses?.per === "charges"));
			if (items?.length > 0) {
				let totalCharges = 0;
				let totalQuantity = 0;
				for (let item of items) {
					totalCharges += item.data.data.uses.value + (item.data.data.quantity - 1) * item.data.data.uses.max;
					totalQuantity += item.data.data.quantity;
				}
				if (totalCharges > 0) {
					waterList.push({name: `${items[0].name} (${totalQuantity}) (${totalCharges / containerSpec[1]} ${game.i18n.localize("FWT.gallonWater")}${(totalCharges / containerSpec[1] !== 1) ? game.i18n.localize("FWT.gallonsWater") : ""})`, id: items[0].id});	
				}
			}
		}
	}

	const data = {
		noFoodDays,
		maxFoodDays,
		reqWater,
		halfReqWater,
		noWaterDays,
		maxWaterDays,
		showMaxWaterDays,
		pluralGallons,
		halfPluralGallons,
		showSRDrules,
		showCustomRules,
		customFoodRuleText,
		customWaterRuleText,
		showDefaultFoodOptions: !listFoodItemOptions,
		listFoodItemOptions,
		foodList,
		showDefaultWaterOptions: !listWaterContainers,
		listWaterContainers,
		waterList
	};
	return data;
}
