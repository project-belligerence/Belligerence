(function() {
	'use strict';

	module.exports = { // 0 represents the type, 1 the actual class | so "01" are for assault rifles, "11" the helmets, etc
		types: {
			"0": {label: "weapons", modifier: "Weapons"},
			"1": {label: "clothing", modifier: "Clothing"},
			"2": {label: "vehicles", modifier: "Vehicles"},
			"3": {label: "medical", modifier: "Medical"},
			"4": {label: "items", modifier: "Items"},
			"5": {label: "others", modifier: "Others"},
			"6": {label: "bureaucracy", modifier: "Bureaucracy"}
		},
		classes: {
			"01": {label: "assault rifles", modifier: "AssaultRifles"},
			"02": {label: "machine-guns", modifier: "MachineGuns"},
			"03": {label: "battle rifles", modifier: "BattleRifles"},
			"04": {label: "pistols", modifier: "Pistols"},

			"11": {label: "helmets", modifier: "Helmets"},
			"12": {label: "vests", modifier: "Vests"},
			"13": {label: "uniforms", modifier: "Uniforms"}
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
		}
	}

})();