(function(){

	'use strict';

	var config = require('./../../config.js');

	module.exports = function(sequelize, DataTypes) {
			var PMCModel = sequelize.define('pmc_table',
			{
				displaynameField: {
					type: DataTypes.STRING,
					field: 'display_name'
				},
				mottoField: {
					type: DataTypes.TEXT,
					field: 'motto'
				},
				locationField: {
					type: DataTypes.STRING,
					field: 'location',
					defaultValue: 'International'
				},
				bioField: {
					type: DataTypes.TEXT,
					field: 'bio'
				},
				tierNameFields: {
					type: DataTypes.TEXT,
					field: 'tier_names',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('tierNameFields'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('tierNameFields', API.methods.setPseudoArray(val));
					}
				},
				tagsField: {
					type: DataTypes.TEXT,
					field: 'tags',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('tagsField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('tagsField', API.methods.setPseudoArray(val));
					}
				},
				colorsField: {
					type: DataTypes.TEXT,
					field: 'colors',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('colorsField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('colorsField', API.methods.setPseudoArray(val));
					}
				},
				PMCPrestige: {
					type: DataTypes.INTEGER,
					field: 'prestige',
					defaultValue: 1
				},
				sizeTier: {
					type: DataTypes.INTEGER,
					field: 'size',
					defaultValue: 1 // if this hits -1 the PMC is defunct
				},
				currentFunds: {
					type: DataTypes.FLOAT,
					field: 'funds',
					defaultValue: config.numbers.modules.players.startingCashPMC
				},
				openForApplications: {
					type: DataTypes.BOOLEAN,
					field: 'open_applications',
					defaultValue: true
				},
				privateFields: {
					type: DataTypes.TEXT,
					field: 'private_fields',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('privateFields'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('privateFields', API.methods.setPseudoArray(val));
					}
				},
				privateVisibility: {
					type: DataTypes.STRING,
					field: 'private_visibility',
					defaultValue: 'nobody'
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'PMC',
					plural: 'PMC',
				},
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);

						model.setDataValue('hashField', newHash);
					}
				},
				classMethods: {
					blacklistProperties: function(mode, role) {
						switch (mode) {
							case 'query': {
								switch (role) {
									case 'admin': { return []; }
									case 'user': { return [
										'id', 'private_fields', 'private_visibility', 'funds', 'updatedAt'
									]; }
									default: { return []; }
								}
							} break;
							case 'creation': { return 'funds, prestige'; }
						}
					},
					whitelistProperties: function(mode, role) {
						switch (mode) {
							case 'query': {
								switch (role) {
									case 'admin': { return []; }
									case 'user': {
 									return [
 										'motto', 'location', 'createdAt', 'totalPlayers', 'tags', 'prestige', 'size', 'totalPlayers', 'funds', 'hideComments', 'blockComments'
									]; }
									default: { return []; }
								}
							} break;
						}
					},
					associate: function(models) {
						PMCModel.hasMany(models.players, {
							onDelete: "CASCADE",
							foreignKey: {
								allowNull: true
							}
						});
						PMCModel.belongsToMany(models.upgrades, { through: models.pmc_upgrades });
					},
					defaultValues: function(value) {
						switch(value) {
							case "tierNameFields": { return ['CEO','Commander', 'Officer', 'Sargeant', 'Soldier']; }
						}
					}
				},
				instanceMethods: {
					spendFunds: function(amount, done) {
						var funds = this.currentFunds,
							rObject = {
								neededFunds: amount,
								currentFunds: funds,
								valid: (funds >= amount)
							};

						if (funds >= amount) {
							this.update({ currentFunds: (funds - amount) }).then(function() { return done(rObject); });
						} else { return done(rObject); }
					},
					getAllTransactions: function(done) {
						var TransactionHistoryModel = require('./../index.js').getModels().transaction_history,
							thisHash = this.getDataValue('hashField');

						TransactionHistoryModel.findAll(
							{ where: {$or: [{buyerHash: {$eq: thisHash}}, {recipientHash: { $eq: thisHash }},] }}
						).then(function(transactions) {
							return done(transactions);
						});
					},
					getBuyerTransactions: function(done) {
						var TransactionHistoryModel = require('./../index.js').getModels().transaction_history,
							thisHash = this.getDataValue('hashField');

						TransactionHistoryModel.findAll(
							{ where: {buyerHash: thisHash }}
						).then(function(transactions) {
							return done(transactions);
						});
					},
					getRecipientTransactions: function(done) {
						var TransactionHistoryModel = require('./../index.js').getModels().transaction_history,
							thisHash = this.getDataValue('hashField');

						TransactionHistoryModel.findAll(
							{ where: {recipientHash: thisHash }}
						).then(function(transactions) {
							return done(transactions);
						});
					},
					addNewItem: function(p_itemHash, amount, deployed, done) {
						var PMCItems = require('./../index.js').getModels().pmc_items,
							thisHash = this.getDataValue('hashField');

						PMCItems.create({ownerHash: thisHash, itemHash: p_itemHash, amountField: amount, deployedField: (deployed || false)}).then(function(ownedItem) {
							return done(ownedItem);
						});
					},
					getItems: function(done) {
						var PMCItems = require('./../index.js').getModels().pmc_items,
							ItemModel = require('./../index.js').getModels().items,
							thisHash = this.getDataValue('hashField');

						PMCItems.findAll({where: {ownerHash: thisHash}}).then(function(ownedItems) {
							var itemHashes = [];
							for (var i=0; i < ownedItems.length; i++) { itemHashes.push(ownedItems[i].dataValues.itemHash); }

							ItemModel.findAll({where: {hashField: itemHashes}}).then(function(foundOwnedItems) {
								for (var i=0; i < ownedItems.length; i++) { ownedItems[i].dataValues.itemData = foundOwnedItems[i].dataValues; }
								return done(ownedItems);
							});
						});
					},
					hasItem: function(p_itemHash, done) {
						var PMCItems = require('./../index.js').getModels().pmc_items,
							thisHash = this.getDataValue('hashField');

						PMCItems.findOne({where: {ownerHash: thisHash, itemHash: p_itemHash}}).then(function(ownedItem) {
							return done(ownedItem);
						});
					},
					makeSettings: function(done) {
						var PMCSettings = require('./../index.js').getModels().pmc_settings,
							thisHash = this.getDataValue('hashField');

						PMCSettings.create({pmcHash: thisHash}).then(function(settings) { return done(settings); });
					},
					getSettings: function(done) {
						var PMCSettings = require('./../index.js').getModels().pmc_settings,
							thisHash = this.getDataValue('hashField'),
							thisModel = this;

						PMCSettings.findOne({where: {pmcHash: thisHash}}).then(function(settings) {
							if (settings) {
								return done(settings);
							} else {
								thisModel.makeSettings(function(n_settings) { return done(n_settings); });
							}
						});
					},
					updateSettings: function(p_settings, done) {
						var PMCSettings = require('./../index.js').getModels().pmc_settings,
							thisHash = this.getDataValue('hashField'),
							thisModel = this;

						PMCSettings.findOne({where: {pmcHash: thisHash}}).then(function(settings) {
							if (settings) {
								settings.update(p_settings).then(function(u_settings) { return done(true); });
							} else {
								thisModel.makeSettings(function(n_settings) { return done(n_settings); });
							}
						});
					}
				}
			}
		);

		PMCModel.afterCreate(function(model, options) { return model.makeSettings(); });

		return PMCModel;
	};

})();