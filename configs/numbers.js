(function() {
	'use strict';

	module.exports = {
		general: {
			tagsLimit: 5,
			tagsLength: 32
		},
		modules: {
			players: {
				startingCashFreelancer: 2000,
				startingCashPMC: 5000,
				usernameLength: [5, 32],
				passwordLength: [6, 64],
				bioLength: [0, 255],
				locationLength: [0, 32],
				aliasLength: [1, 32]
			},
			pmc: {
				tierLength: [0, 16],
				membersPerTier: 4,
				displaynameLength: [6, 24],
				mottolength: [0, 128]
			},
			upgrades: {
				maxProminent: 5
			},
			modifiers: {
				minDiscount: -50000,
				maxDiscount: 100
			},
			messages: {
				maxTitleLength: 32,
				maxBodyLength: 1024
			},
			stock: {
				minAmount: 0,
				maxAmount: 999
			},
			bans: {
				reasonLength: 260
			},
			intel: {
				titleLength: 50,
				bodyLength: 64,
				bodyMaxLength: [0, 2048]
			},
			items: {
				descriptionLength: 240
			}
		}
	};

})();