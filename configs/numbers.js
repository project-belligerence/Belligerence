(function() {
	'use strict';

	module.exports = {
		general: {
			tagsLimit: 5,
			tagsLength: 32
		},
		modules: {
			players: {
				startingCashFreelancer: 5000,
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
				mottolength: [0, 64],
				rankUpMultiplier: 0.3
			},
			upgrades: {
				maxProminent: 5,
				respecFundsPercent: 70
			},
			modifiers: {
				minDiscount: -50000,
				maxDiscount: 100,
				prestigeRankUpMultiplier: 5
			},
			messages: {
				maxTitleLength: 48,
				maxBodyLength: 1024
			},
			stores: {
				healChance: 70,
				liquidationMargin: 50 // Whenever a percentage of items restocked is above this threshold its price will increase
			},
			stock: {
				minAmount: 0,
				maxAmount: 999
			},
			bans: {
				reasonLength: 260
			},
			comments: {
				titleLength: 21,
				bodyLength: 144
			},
			intel: {
				queryLimit: 4,
				titleLength: 50,
				bodyLength: 256,
				bodyMaxLength: [0, 2048]
			},
			items: {
				descriptionLength: 512
			},
			factions: {
				minimumAssetsToStartConflict: 1000,
				minimumAssetsToDefendConflict: 500,
				homeMapResolutionBonus: 3,
				assetDailyRecoverPercent: 10
			},
			locations: {
				importanceBonusLimit: 10,
				importanceMultiplier: 5
			},
			missions: {
				missionsPerConflict: 6,
				adversarialMissionsDay: 1,
				adversarialDays: [5, 6],
				MAX_GENERATION_ATTEMPTS: 100,
				signatureFee: 15,
				networthPercentage: 50
			}
		}
	};

})();