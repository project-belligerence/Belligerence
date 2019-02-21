(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		ItemModel = require('./../index.js').getModels().items,
		UpgradeModel = require('./../index.js').getModels().upgrades,
		PMCUpgrades = require('./../index.js').getModels().pmc_upgrades,
		PlayerUpgrades = require('./../index.js').getModels().player_upgrades,
		ModifierModel = require('./../index.js').getModels().modifiers,
		TransactionHistory = require('./../index.js').getMethods().transaction_history,
		Items = require('.//../index.js').getMethods().items,
		UpgradesMethods = require('.//../index.js').getMethods().upgrades,
		Stores = require('./../index.js').getMethods().stores,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.purchaseItem = purchaseItem;
	exports.purchaseUpgrade = purchaseUpgrade;
	exports.getTotalModifiedUpgradePrice = getTotalModifiedUpgradePrice;

	initializeWebsocketEvents();
	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();

		config.websocket.registerEvent("StoreNewStock", WebsocketEvent);
	}

	function purchaseItem(req, res, buyer, buyer_type, products, store, done) {

		var i, j, model = (buyer_type == "player") ? PlayerModel : PMCModel,
			productsHash = [],
			productsAmount = [],
			buyerPrestige = 0;

		if (buyer_type == "pmc") {
			if (req.playerInfo.PMC) {
				buyerPrestige = buyer.PMCPrestige;
			}
		} else {
			buyerPrestige = req.playerInfo.playerPrestige;
		}

		for (i=0; i < products.length; i++) { productsHash.push(products[i][0]); productsAmount.push(products[i][1]); }

		productsAmount = API.methods.minMaxArray(0, 9999, productsAmount);

		var surrogateItemsHash = API.methods.cloneArray(productsHash);

		API.methods.validateEntriesRecursive(req, res, "items", "hashField", surrogateItemsHash, function() {
			Stores.validateStore(req, res, store, buyerPrestige, function(store) {

				var entity = API.methods.getMainEntity(req);

				UpgradesMethods.checkRanksRecursive(req, res, entity, store.requiredUpgradesField, false, function(whiteRank) {
					UpgradesMethods.checkRanksRecursive(req, res, entity, store.blacklistedUpgradesField, true, function(blackRank) {
						if (!API.methods.validate(req, res, [whiteRank[0]], config.messages().modules.upgrades.transaction_upgrade_low_rank((whiteRank[1] || 'Unknown'), (whiteRank[2] || 'Unknown'), (whiteRank[3] || 'Unknown')))) { return 0; }
						if (!API.methods.validate(req, res, [blackRank[0]], config.messages().modules.upgrades.transaction_upgrade_high_rank((blackRank[1] || 'Unknown'), (blackRank[2] || 'Unknown'), (blackRank[3] || 'Unknown')))) { return 0; }

						ItemModel.findAll({ where: { "hashField": productsHash }}).then(function(r_items) {
							if (!API.methods.validate(req, res, [r_items], config.messages().no_entries)) { return 0; }

							var orderedItems = [];

							for (i = productsHash.length - 1; i >= 0; i--) {
								for (j = r_items.length - 1; j >= 0; j--) {
									if (productsHash[i] === r_items[j].hashField) orderedItems.push(r_items[j]);
								}
							}
							orderedItems = orderedItems.reverse();

							store.checkStockAvailable(req, res, orderedItems, productsAmount, function(stockReturn) {
								var actualAmount = stockReturn.actualAmount;

								getTotalItemPrice(orderedItems, stockReturn, function(price) {

									buyer.spendFunds(price, function(r) {
										if (r.valid) {
											var storeItems = orderedItems,
												storeAmount = actualAmount,
												nParams = {items: orderedItems, amounts: actualAmount};

											Stores.updateStoreStockRecursive(store, nParams, "minus", function(success) {
												Items.addItemRecursive(req, res, orderedItems, buyer, buyer_type, actualAmount, function(success2) {

													var transactionRecord = {
														buyer: req.playerInfo.hashField,
														buyer_IP: req.playerInfo.lastIPField,
														recipient_type: buyer_type,
														recipient: buyer.hashField,
														seller: store.hashField,
														seller_type: 'store',
														type: 'item',
														object: productsHash,
														amount: actualAmount,
														cost: price
													};

													TransactionHistory.post(req, res, transactionRecord, function() {
														config.websocket.broadcastEvent("StoreNewStock", [store.hashField]);
														return done(r);
													});
												});
											});
										} else {
											return done(r);
										}
									});
								});
							});
						});
					});
				});
			});
		});
	}

	function getTotalItemPrice(products, stock, done) {
		var totalPrice = 0;
		for (var i=0; i < products.length; i++) {
			var amount = stock.actualAmount[i],
				discount = stock.actualDiscount[i];

			var calculatedItemPrice = (products[i].currentPrice - (products[i].currentPrice*((discount))/100));
			totalPrice = totalPrice + (calculatedItemPrice * amount);
		}
		return done(totalPrice);
	}

	function getTotalModifiedUpgradePrice(req, res, buyer, buyer_type, upgrade, ownedUpgrade, done) {

		ModifierModel.findOne({ where: {"activeField": true}}).then(function(modifier) {
			if (!API.methods.validate(req, res, [modifier], config.messages().modules.modifiers.no_active)) { return 0; }

			var totalValue = 0,
				totalModifiers = [];

			totalModifiers.push((modifier.discountAll || 0));
			totalModifiers.push(modifier.discounts_upgrades || 0);

			totalValue = ((upgrade.baseCost * ((ownedUpgrade.rankField || 0) + 1)) * upgrade.costMultiplier);

			API.methods.doLog(req, "The upgrade costs " + totalValue + " from a base cost of " + upgrade.baseCost + " multiplied by " + upgrade.costMultiplier + " times the rank of " + (ownedUpgrade.rankField + 1) + ".");

			return done(totalValue);
		});
	}

	function purchaseUpgrade(req, res, buyer, buyer_type, p_upgrade, done) {

		UpgradeModel.findOne({where:{'hashField': p_upgrade}}).then(function(upgrade) {
			if (!API.methods.validate(req, res, [upgrade], config.messages().entry_not_found(p_upgrade))) { return 0; }

			var correctType = (function(buyer, type) {
				var upgradesEnum = config.enums.upgrades_owner;

				if (type === upgradesEnum[0].data) return true;
				switch(buyer) {
					case "player": { return (type === upgradesEnum[2].data); }
					case "pmc": { return (type === upgradesEnum[1].data); }
				}
			})(buyer_type, upgrade.typeField);

			if (!API.methods.validate(req, res, [correctType], config.messages().modules.upgrades.wrong_type)) { return 0; }

			var newQuery = (buyer_type == "player") ? {'upgradeId': upgrade.id, 'PlayerId': buyer.id} : {'upgradeId': upgrade.id, 'PMCId': buyer.id},
				newModel = (buyer_type == "player") ? PlayerUpgrades : PMCUpgrades,
				entity = API.methods.getMainEntity(req);

			UpgradesMethods.checkRanksRecursive(req, res, entity, upgrade.requiredUpgradesField, false, function(whiteRank) {
				UpgradesMethods.checkRanksRecursive(req, res, entity, upgrade.blacklistedUpgradesField, true, function(blackRank) {
					if (!API.methods.validate(req, res, [whiteRank[0]], config.messages().modules.upgrades.transaction_upgrade_low_rank((whiteRank[1] || 'Unknown'), (whiteRank[2] || 'Unknown'), (whiteRank[3] || 'Unknown')))) { return 0; }
					if (!API.methods.validate(req, res, [blackRank[0]], config.messages().modules.upgrades.transaction_upgrade_high_rank((blackRank[1] || 'Unknown'), (blackRank[2] || 'Unknown'), (blackRank[3] || 'Unknown')))) { return 0; }

					newModel.findOne({where: newQuery}).then(function(ownedUpgrade) {
						var FownedUpgrade = ownedUpgrade ? ownedUpgrade : {rankField: 0};

						if (!API.methods.validate(req, res, [((FownedUpgrade.rankField + 1) <= upgrade.maxTier)], config.messages().modules.upgrades.max_tier)) { return 0; }

						getTotalModifiedUpgradePrice(req, res, buyer, buyer_type, upgrade, FownedUpgrade, function(price) {
							API.methods.doLog(req, "TOTAL: D$" + price);
							buyer.spendFunds(price, function(r) {
								if (r.valid) {
									var transactionRecord = {
										buyer: req.playerInfo.hashField,
										buyer_IP: req.playerInfo.lastIPField,
										recipient_type: buyer_type,
										recipient: buyer.hashField,
										seller: 'system',
										seller_type: 'system',
										type: 'upgrade',
										object: upgrade.hashField,
										amount: (FownedUpgrade.rankField + 1),
										cost: price
									};

									TransactionHistory.post(req, res, transactionRecord, function() {
										config.websocket.broadcastEvent("NewUpgrade", [buyer_type, buyer.hashField]);

										if (ownedUpgrade) {
											ownedUpgrade.update({rankField:(ownedUpgrade.rankField + 1)}).then(function() { return done(r);	});
										} else { buyer.addUpgrade(upgrade).then(function() { return done(r); }); }
									});
								} else { return done(r); }
							});
						});
					});
				});
			});
		});
	}

})();