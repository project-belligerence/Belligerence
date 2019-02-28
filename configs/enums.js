(function() {
	'use strict';

	module.exports = { // 0 represents the type, 1 the actual class | so "03" are for assault rifles, "31" the helmets, etc
		types: {
			"0": {name: "Weapon", label: "weapons", modifier: "Weapons", details: ["Caliber", "Weight (kg)", "Max. Capacity", "Accuracy (m)", "RPM"]},
			"1": {name: "Ammunition", label: "ammunition", modifier: "Ammo", details: ["Caliber/Class", "Rounds", "Tracer"]},
			"2": {name: "Attachment", label: "attachments", modifier: "Attachments", details: ["Rail", "Caliber", "Magnification", "Color"]},
			"3": {name: "Wear", label: "clothing", modifier: "Clothing", details: ["Carry Weight", "Armor", "Penetration"]},
			"4": {name: "Vehicle", label: "vehicles", modifier: "Vehicles", details: ["Armor", "Passengers", "Avg. Speed (km/h)", "Main Weapon"]},
			"5": {name: "Static", label: "static", modifier: "Static", details: ["Assemblable", "Caliber"]},
			"6": {name: "Medical", label: "medical", modifier: "Medical", details: []},
			"7": {name: "Item", label: "items", modifier: "Items", details: []},
			"8": {name: "Bureaucracy", label: "bureaucracy", modifier: "Bureaucracy", details: []},
			"9": {name: "Other", label: "others", modifier: "Others", details: []}
		},
		classes: {
			"01": {name: "Sidearm", label: "pistols", modifier: "Sidearms"},
			"02": {name: "Submachine Gun", label: "smg", modifier: "SMG"},
			"03": {name: "Assault Rifle", label: "assault-rifles", modifier: "AssaultRifles"},
			"04": {name: "Battle Rifle", label: "battle-rifles", modifier: "BattleRifles"},
			"05": {name: "Shotgun", label: "shotguns", modifier: "Shotguns"},
			"06": {name: "Marksman Rifle", label: "marksman-rifles", modifier: "MarksmanRifles"},
			"07": {name: "Sniper Rifle", label: "sniper-rifles", modifier: "SniperRifles"},
			"08": {name: "Light Machine Gun", label: "lmg", modifier: "LMG"},
			"09": {name: "Medium Machine Gun", label: "mmg", modifier: "MMG"},
			"0901": {name: "Launcher", label: "launchers", modifier: "Launchers"},
			"0902": {name: "Miscellaneous", label: "miscellaneous", modifier: "Miscellaneous"},

			"11": {name: "Magazine", label: "magazines", modifier: "Magazines"},
			"12": {name: "Extended Magazine", label: "extended-magazines", modifier: "ExtendedMagazines"},
			"13": {name: "Underbarrel Grenade", label: "underbarrel-grenade", modifier: "UnderbarrelGrenades"},
			"14": {name: "Belt Case", label: "belt", modifier: "Belts"},
			"15": {name: "Rocket", label: "rockets", modifier: "Rockets"},
			"16": {name: "Missile", label: "missiles", modifier: "Missiles"},
			"17": {name: "Special", label: "special", modifier: "Special"},

			"21": {name: "Muzzle", label: "muzzle", modifier: "Muzzle"},
			"22": {name: "Side", label: "side", modifier: "Side"},
			"23": {name: "CCO", label: "cco", modifier: "CCO"},
			"24": {name: "RCO", label: "rco", modifier: "RCO"},
			"25": {name: "Sniping Scope", label: "sniping-scope", modifier: "SnipingScope"},
			"26": {name: "Tripod", label: "tripod", modifier: "Tripod"},

			"31": {name: "Headgear", label: "helmets", modifier: "Helmets"},
			"32": {name: "Vest", label: "vests", modifier: "Vests"},
			"33": {name: "Uniform", label: "uniforms", modifier: "Uniforms"},
			"34": {name: "Facewear", label: "facewear", modifier: "Facewear"},
			"35": {name: "Backpack", label: "backpacks", modifier: "Backpacks"},

			"41": {name: "Civilian Vehicle", label: "civilian", modifier: "Civilian"},
			"42": {name: "Light Truck", label: "light-truck", modifier: "LightTruck"},
			"43": {name: "Truck", label: "truck", modifier: "Truck"},
			"44": {name: "Support", label: "support", modifier: "Support"},
			"45": {name: "APC/IFV", label: "apc", modifier: "APC"},
			"46": {name: "MRAP", label: "mrap", modifier: "MRAP"},
			"47": {name: "Battle Tank", label: "battle-tank", modifier: "BattleTank"},
			"48": {name: "Ship", label: "ship", modifier: "Ship"},
			"49": {name: "Mobile Artillery/AA", label: "artillery", modifier: "Artillery"},
			"4901": {name: "Jet", label: "jet", modifier: "jet"},
			"4902": {name: "Helicopter", label: "helicopter", modifier: "helicopter"},
			"4903": {name: "Other", label: "other", modifier: "other"},

			"51": {name: "Turret", label: "turret", modifier: "Turrets"},
			"52": {name: "AT/AA Launcher", label: "ATAA", modifier: "ATAA"},
			"53": {name: "Mortar", label: "mortar", modifier: "Mortar"},
			"54": {name: "Artillery", label: "artillery", modifier: "Artillery"},
			"55": {name: "Anti-Air", label: "AA", modifier: "AA"},

			"61": {name: "Bandage", label: "bandages", modifier: "Bandages"},
			"62": {name: "Injectable", label: "injectable", modifier: "Injectables"},
			"63": {name: "Fluid Bag", label: "fluid-bags", modifier: "FluidBags"},
			"64": {name: "Equipment", label: "equipment", modifier: "Equipment"},
			"65": {name: "Other", label: "other", modifier: "Other"},

			"71": {name: "Hand Grenade", label: "grenades", modifier: "Grenades"},
			"72": {name: "Signaling Grenade", label: "signaling-grenade", modifier: "SignalingGrenades"},
			"73": {name: "Explosive Charge", label: "explosive-charges", modifier: "ExplosiveCharges"},
			"74": {name: "AP Mine", label: "ap-mines", modifier: "APMines"},
			"75": {name: "AT Mine", label: "at-mines", modifier: "ATMines"},
			"76": {name: "Navigation", label: "navigation", modifier: "Navigation"},
			"78": {name: "Personal", label: "personal", modifier: "Personal"},
			"79": {name: "Other", label: "other", modifier: "Other"}
		},
		store_types: [
			{name: "Weapons", icon: "ion-pinpoint"},
			{name: "Apparel", icon: "ion-tshirt"},
			{name: "Vehicles", icon: "ion-android-car"},
			{name: "Static", icon: "ion-flag"},
			{name: "Medical", icon: "ion-ios-medical"},
			{name: "Items", icon: "ion-settings"},
			{name: "Other", icon: "ion-gear-b"}
		],
		upgrades_owner: [
			{text: "Both", data: 0},
			{text: "Outfit", data: 1},
			{text: "Freelancer", data: 2}
		],
		upgrades_types: [
			{text: "Miscellaneous", data: 0},
			{text: "Contract", data: 1},
			{text: "Logistics", data: 2},
			{text: "Offensive", data: 3},
			{text: "Intelligence", data: 4},
			{text: "Permit", data: 5}
		],
		sides: {
			"NEUTRAL": 0,
			"BLUFOR": 1,
			"OPFOR": 2,
			"INDFOR": 3
		},
		status: {
			"OK": 0,
			"DEAD": 1,
			"WOUNDED": 2,
			"MISSING": 3,
			"BANNED": 404
		},
		contract: {
			"COMMANDER": 0,
			"SOLDIER": 1,
			"FREELANCER": 2
		},
		modules: {
			stores: {}
		},
		response_status: {
			generic_error: 400,
			generic_success: 200,

			unauthorized: 401,
			forbidden: 403,

			not_found: 404,

			sub_code: {
				banned: 10,
				no_token: 11,
				bad_token: 12
			}
		}
	};
})();