(function() {
	'use strict';

	MarketServicesFunction.$inject = ["$rootScope", "$timeout", "$cookies", "apiServices", "generalServices", "alertsServices", "uiServices"];

	function MarketServicesFunction($rootScope, $timeout, $cookies, apiServices, generalServices, alertsServices, uiServices) {

		var methods = {
			addToCart: addToCart,
			getCart: getCart,
			getCartSize: getCartSize,
			getCartObjects: getCartObjects,
			clearCart: clearCart,
			removeFromCart: removeFromCart,
			askReportStore: askReportStore,
			askReRollStore: askReRollStore,
			doResupplyStore: doResupplyStore
		},
		apiAnchor = "/api/generalactions/",
		adminAnchor = "/api/adminactions/",
		cartCookie = "storeMarketCart";

		function addToCart(store, item, amount) {

			if (apiServices.getToken()) {

				var currentCart = getCart(),
					newAddedStore = { store: store, items: [{item: item, amount: amount}] };

				if (currentCart.length > 0) {
					var foundStoreIndex = -1;

					for (var i in currentCart) {
						var cCart = currentCart[i];

						if (cCart.store === store) {
							foundStoreIndex = i;

							var cCartItems = cCart.items,
								foundIndex = -1;

							for (var j in cCartItems) {
								var cCartItemsItem = cCartItems[j];
								if (cCartItemsItem.item === item) foundIndex = j;
							}
							if (foundIndex > -1) { cCartItems[foundIndex].amount = amount; }
							else { cCartItems.push({item: item, amount: amount}); }
						}
					}
					if (foundStoreIndex === -1) currentCart.push(newAddedStore);
				} else { currentCart.push(newAddedStore); }

				$cookies.put("storeMarketCart", JSON.stringify(currentCart));

				$rootScope.$emit("navbar:refreshCurrentCart");

			} else { alertsServices.addNewAlert("warning", "You must be logged in order to purchase items."); }
		}

		function removeFromCart(store, item) {

			var i, sIndex = -1, currentCart = getCart(), storeHash = store;
			for (i in  currentCart) { if ( currentCart[i].store === storeHash) sIndex = i; }
			if (sIndex > -1) for (i in  currentCart[sIndex].items) {
				if ( currentCart[sIndex].items[i].item === item) {
					currentCart[sIndex].items.splice(i, 1);
					if (currentCart[sIndex].items.length === 0) currentCart.splice(sIndex, 1);

					$cookies.put("storeMarketCart", JSON.stringify(currentCart));
					$rootScope.$emit("navbar:refreshCurrentCart");
				}
			}
		}

		function getCart() { return (apiServices.getToken() ? JSON.parse(($cookies.get(cartCookie) || "[]")) : []); }

		function getCartSize() {
			var currentCart = getCart(), allStoreItems = [];
			for (var i in currentCart) {
				var cCart = currentCart[i];
				for (var j in cCart.items) {
					var cStoreItem = cCart.items[j];
					allStoreItems.push(cStoreItem.item);
				}
			}
			return (allStoreItems.length);
		}

		function getCartObjects() {
			var currentCart = getCart(), allStores = [], allItems = [];

			for (var i in currentCart) {
				var cCart = currentCart[i];
				allStores.push(cCart.store);
				for (var j in cCart.items) { allItems.push(cCart.items[j].item); }
			}

			return generalServices.getStoresAndItems(_.uniq(allStores), _.uniq(allItems));
		}

		function askReportStore(args) {
			var
			modalOptions = { alias: args.nameField,	hash: args.hashField, content: "store", types: ["storeItems", "storeData"] },
			newModal = uiServices.createModal('SendReport', modalOptions);
			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function askReRollStore() {
			var
				modalOptions = {
					header: { text: "Resupply the store's stock?", icon: "ion-loop" },
					body: {	text: "This will resupply and randomize the Store's stock and discounts based on its current settings." },
					choices: {
						yes: { text: 'Yes', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);
			return newModal.result;
		}

		function doResupplyStore(hash) {
			return apiServices.requestPOST({url: (adminAnchor + "resupplyStoreStock/" + hash) }).then(function(data) {
				return apiServices.handleRequestData(data);
			});
		}

		function clearCart() {
			$rootScope.$emit("navbar:resetCurrentCart");
			$cookies.remove("storeMarketCart");
		}

		return methods;
	}

	exports.function = MarketServicesFunction;
})();