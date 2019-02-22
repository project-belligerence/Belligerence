(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var IntelModel = sequelize.define('intel_table',
			{
				originalPosterHash: { // HashField of the Intel poster (as player)
					type: DataTypes.STRING,
					field: 'original_poster_hash'
				},
				posterHash: { // HashField of the Intel poster (may be the PMC hash)
					type: DataTypes.STRING,
					field: 'poster_hash'
				},
				displayAs: { // Whether the Intel will be shown as posted by the player or as the PMC or Anonymous
					type: DataTypes.STRING,
					field: 'display',
					defaultValue: 'self'
				},
				posterDetails: { // Dummy field which will be replaced with the info relating to the displayed poster
					type: DataTypes.STRING,
					field: 'poster_details'
				},
				originalPosterDetails: { // Dummy field which will be replaced with the info relating to the original poster
					type: DataTypes.STRING,
					field: 'original_poster_details'
				},
				cheersDetails: { // Dummy field that contains the hashes of all users that have cheered the content.
					type: DataTypes.STRING,
					field: 'cheers'
				},
				titleField: { // Title of the Intel
					type: DataTypes.STRING,
					field: 'title',
					defaultValue: 'No Title'
				},
				bodyField: { // Body with the text typed
					type: DataTypes.TEXT,
					field: 'body'
				},
				typeField: { // Type of the message. "statement", "intel", "certification", etc
					type: DataTypes.STRING,
					field: 'type',
					defaultValue: 'intel'
				},
				visibilityField: { // Who can see the Intel. "freelancers", "ownPMC", "allPMC", "friends", "everyone"
					type: DataTypes.STRING,
					field: 'visibility',
					defaultValue: 'everyone'
				},
				backgroundField: {
					type: DataTypes.STRING,
					field: 'background_field',
					defaultValue: '#fff'
				},
				backgroundType: {
					type: DataTypes.STRING,
					field: 'background_type',
					defaultValue: 'color'
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);

						model.setDataValue('hashField', newHash);
					}
				},
				freezeTableName: true
			}
		);

		IntelModel.afterFind(function(model, options) {

			if (model) {
				var PlayerModel = require('./../index.js').getModels().players,
					PMCModel = require('./../index.js').getModels().pmc,
					CheersModel = require('./../index.js').getModels().cheers,
					config = require('./../../config.js'),
					API = require('./../../routes/api.js'),
					foundModels = [],
					foundModelsHashes = [],
					posterHashes = [],
					originalPosterHashes = [];

				if (!(options.limit)) { options.limit = 0; }
				foundModels = (options.limit === 1) ? [model] : model;

				for (var i=0; i < foundModels.length; i++) {
					posterHashes.push(foundModels[i].posterHash);
					originalPosterHashes.push(foundModels[i].originalPosterHash);
					foundModelsHashes.push(foundModels[i].hashField);
				}

				return CheersModel.findAll({ where: {"targetHash": foundModelsHashes, "typeField": "intel"}}).then(function(cheers) {
		 			for (var i=0; i < foundModels.length; i++) {
		 				var modelCheers = [],
		 					currentModel = foundModels[i];

		 				for (var j=0; j < cheers.length; j++) {
		 					if (cheers[j].targetHash == currentModel.hashField) {
		 						modelCheers.push(cheers[j].senderHash);
		 					}
		 				}
 						currentModel.setDataValue('cheersDetails', modelCheers);
		 			}

					return PlayerModel.findAll({ where: {"hashField": originalPosterHashes}, include: [ { model: PMCModel, as: 'PMC', attributes: ['hashField'] } ]}).then(function(original_posters) {
						return PlayerModel.findAll({ where: {"hashField": posterHashes}}).then(function(players) {
							return PMCModel.findAll({ where: {"hashField": posterHashes}}).then(function(pmc) {
								for (var i=0; i < foundModels.length; i++) {
									var currentModel = foundModels[i];
									for (var j=0; j < original_posters.length; j++) {
										if (currentModel.originalPosterHash === original_posters[j].hashField) {
											currentModel.setDataValue('originalPosterDetails', {
												"alias": original_posters[j].aliasField,
												"PMCHash": (original_posters[j].PMC ? original_posters[j].PMC.hashField : 'freelancer')
											});
										}
									}
									switch (currentModel.displayAs) {
										case "player": {
											for (var g=0; g < players.length; g++) {
												if (currentModel.posterHash === players[g].hashField) {
													currentModel.setDataValue('posterDetails', {
														"alias": players[g].aliasField
													});
												}
											}
										} break;
										case "pmc": {
											for (var x=0; x < pmc.length; x++) {
												if (currentModel.posterHash === pmc[x].hashField) {
													currentModel.setDataValue('posterDetails', {
														"alias": pmc[x].displaynameField
													});
												}
											}
										} break;
										case "anonymous": { currentModel.setDataValue('posterDetails', {alias: "Anonymous"}); }
									}
								}
							});
						});
					});
				});
			}
		});

		return IntelModel;
	};

})();