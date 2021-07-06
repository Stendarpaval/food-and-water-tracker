// import LongRestDialogFoodWater from "../apps/long-rest-food-water.js";

const MODULE = "food-and-water-tracker";

Hooks.on("init", () => {
	CONFIG.DND5E.characterFlags["trackFoodAndwater"] = {
		name: "Track Food and Water",
		hint: "Prompt during rests whether you have eaten enough food and drank enough water for the day.",
		section: "Food and Water",
		type: Boolean
	};

	CONFIG.DND5E.characterFlags["DaysWithoutFood"] = {
		name: "Days Without Food",
		hint: "The number of days you have gone without food.",
		section: "Food and Water",
		type: Number,
		placeholder: 0
	}

	CONFIG.DND5E.characterFlags["customFoodLimit"] = {
		name: "Custom Food Limit",
		hint: "Set the maximum number of days that you can go without food (default is 3 + you Constitution modifier, minimum of 1 day).",
		section: "Food and Water",
		type: Number,
		placeholder: 3
	}

	CONFIG.DND5E.characterFlags["DaysWithoutWater"] = {
		name: "Days Without Water",
		hint: "The number of days you have gone without water.",
		section: "Food and Water",
		type: Number,
		placeholder: 0
	}

	CONFIG.DND5E.characterFlags["customWaterLimit"] = {
		name: "Custom Water Minimum",
		hint: "Set the maximum number of days that you can go without water (default is 1 day).",
		section: "Food and Water",
		type: Number,
		placeholder: 1
	}

	game.settings.register(MODULE,"relevantRestTypes", {
		name: "SETTINGS.FW.relevantRestTypes",
		hint: "SETTINGS.FW.relevantRestTypesHint",
		config: true,
		scope: "world",
		default: 1,
		type: Number,
		choices: {
			0: "FW.shortRests",
			1: "FW.longRests",
			2: "FW.shortAndLongRests"
		}
	});

	game.settings.register(MODULE,"thirstSaveDC", {
		name: "SETTINGS.FW.thirstSaveDC",
		hint: "SETTINGS.FW.thirstSaveDCHint",
		config: true,
		scope: "world",
		default: 15,
		type: Number
	});

	game.settings.register(MODULE,"hotWeather", {
		name: "SETTINGS.FW.hotWeather",
		hint: "SETTINGS.FW.hotWeatherHint",
		config: true,
		scope: "world",
		type: Boolean
	});

});


Hooks.on("renderShortRestDialog", async (args, html) => {
	if (typeof args.actor === "undefined") return;
	if (typeof args.actor.data.flags.dnd5e === "undefined") return;
	if (!args.actor.data.flags.dnd5e.trackFoodAndwater) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 1) return;

	const data = await getFWData(args.actor);
	const foodWaterOptions = await renderTemplate('modules/food-and-water-tracker/templates/track-food-water.html', data);
	html.css({height: 'auto'}).find('div[class="dialog-buttons"]').before(foodWaterOptions);
});


Hooks.on("renderLongRestDialog", async (args, html) => {
	if (typeof args.actor === "undefined") return;
	if (typeof args.actor.data.flags.dnd5e === "undefined") return;
	if (!args.actor.data.flags.dnd5e.trackFoodAndwater) return;
	if (game.settings.get(MODULE,"relevantRestTypes") === 0) return;

	const data = await getFWData(args.actor);
	let foodWaterOptions = await renderTemplate('modules/food-and-water-tracker/templates/track-food-water.html', data);
	console.log(foodWaterOptions);
	html.css({height: 'auto'}).find('div[class="dialog-buttons"]').before(foodWaterOptions);
	// await openFoodDialog(args.actor);
});

async function getFWData(consumerActor) {
	let defaultFlagValues = {
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

	let conMod = Math.floor((consumerActor.data.data.abilities.con.value - 10) / 2);
	let maxFoodDays = ((consumerActor.data.flags.dnd5e.customFoodLimit === 0) ? 3 + conMod : consumerActor.data.flags.dnd5e.customFoodLimit);
	let noFoodDays = consumerActor.getFlag("dnd5e","DaysWithoutFood");

	let maxWaterDays = ((consumerActor.data.flags.dnd5e.customWaterLimit == 0) ? 1 : consumerActor.data.flags.dnd5e.customWaterLimit);
	let noWaterDays = consumerActor.getFlag("dnd5e","DaysWithoutWater");
	let reqWater = (game.settings.get(MODULE,"hotWeather") ? 2 : 1);

	const data = {
		noFoodDays,
		maxFoodDays,
		reqWater
	};
	return data;
}


async function openFoodDialog(consumerActor) {
	let defaultFlagValues = {
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

	let conMod = Math.floor((consumerActor._data.data.abilities.con.value - 10) / 2);
	let maxFoodDays = ((consumerActor.data.flags.dnd5e.customFoodLimit == 0) ? 3 + conMod : consumerActor.data.flags.dnd5e.customFoodLimit);
	let noFoodDays = consumerActor.getFlag("dnd5e","DaysWithoutFood");


	new Dialog({
		title: "Food Tracker",
		content: '<form id="food-tracker" class="dialog-content" onsubmit="event.preventDefault();"><p>Days without food: ' + noFoodDays + '/' + maxFoodDays + ' days</p><div class="form-group"><p class="hint">You need to eat at least 1 lb of food per day, though you can stretch your rations by eating 0.5 lb of food per day. At the end of each day after your limit of ' + Math.max(maxFoodDays,1) + ' days, you automatically gain 1 point of exhaustion. A normal day of eating resets the count of days without food to zero.</p></div><p>How much food did you eat today?</p></form>',
		buttons: {
			one: {
				label: "1 lb or more",
				callback: () => {
					console.log(MODULE + " | Resetting `DaysWithoutFood` variable to 0.")
					consumerActor.setFlag("dnd5e","DaysWithoutFood",0);
					openWaterDialog(consumerActor);
				}
			},
			two: {
				label: "0.5 lb",
				callback: () => {
					consumerActor.setFlag("dnd5e","DaysWithoutFood",noFoodDays + 0.5);
					if (noFoodDays + 0.5 >= maxFoodDays + 1) {
						ui.notifications.info(consumerActor.name + " has gained 1 level of exhaustion due to hunger.");
						consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 1});
					}
					openWaterDialog(consumerActor);
				}
			},
			three: {
				label: "None",
				callback: () => {
					consumerActor.setFlag("dnd5e","DaysWithoutFood",noFoodDays + 1);
					if (noFoodDays + 1 > maxFoodDays) {
						ui.notifications.info(consumerActor.name + " has gained 1 level of exhaustion due to hunger.");
						consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 1});
					}
					openWaterDialog(consumerActor);
				}
			}
		},
		default: "one"
	}).render(true);
}


async function openWaterDialog(consumerActor) {
	let maxWaterDays = ((consumerActor.data.flags.dnd5e.customWaterLimit == 0) ? 1 : consumerActor.data.flags.dnd5e.customWaterLimit);
	let noWaterDays = consumerActor.getFlag("dnd5e","DaysWithoutWater");
	let reqWater = (game.settings.get(MODULE,"hotWeather") ? 2 : 1);

	new Dialog({
		title: "Water Tracker",
		content: '<form id="water-tracker" class="dialog-content"><div class="form-group"><p class="hint">You need 1 gallon of water per day, or 2 gallons if the weather is hot. If you only drink half that much water, you must succeed on a DC '+game.settings.get(MODULE,"thirstSaveDC")+' Constitution saving throw or suffer one level of exhaustion at the end of the day. If you drink even less water, you automatically gain 1 level of exhaustion at the end of the day.</p><p class="hint">If you already have one or more levels of exhaustion, you take two levels in either case.</p></div><p>How much water did you drink today?</p></form>',
		buttons: {
			one: {
				label: reqWater + " gallons or more",
				callback: () => {
					consumerActor.setFlag("dnd5e","DaysWithoutWater",0);
				}
			},
			two: {
				label: (reqWater / 2) + " gallons",
				callback: () => {
					consumerActor.setFlag("dnd5e","DaysWithoutWater",noWaterDays + 0.5);
					if (consumerActor._data.data.attributes.exhaustion != 0) {
						ui.notifications.info(consumerActor.name + " has gained 2 levels of exhaustion due to dehydration.");
						consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 2});
					} else {
						(async () => {
							let conSave = await consumerActor.rollAbilitySave("con",{flavor: "Succeed on a DC "+game.settings.get(MODULE,"thirstSaveDC")+" Constitution saving throw or gain 1 level of exhaustion due to thirst."});
							if (conSave._total < game.settings.get(MODULE,"thirstSaveDC")) {
								ui.notifications.info(consumerActor.name + " has gained 1 level of exhaustion due to thirst.");
								consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 1});
							}
						})();
						
					}
				}
			},
			three: {
				label: "Less than " + (reqWater / 2) + " gallons",
				callback: () => {
					consumerActor.setFlag("dnd5e","DaysWithoutWater",noWaterDays + 1);
					if (consumerActor._data.data.attributes.exhaustion != 0) {
						ui.notifications.info(consumerActor.name + " has gained 2 levels of exhaustion due to dehydration.");
						consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 2});
					} else {
						ui.notifications.info(consumerActor.name + " has gained 1 level of exhaustion due to thirst.");
						consumerActor.update({"data.attributes.exhaustion": consumerActor._data.data.attributes.exhaustion + 1});
					}
				}
			}
		},
		default: "one"
	}).render(true);
}

