(function(){
	'use strict';

	/*
		VERY HACKY MODEL ONLY ACCESSABLE THROUGH OWNER PERMISSIONS
	*/

	var AccessKeysModel = require('./../index.js').getModels().access_keys,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "AccessKeys",
		mainModel = AccessKeysModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.checkKeyValidity = checkKeyValidity;
	exports.deleteKey = deleteKey;
	exports.checkKeyValidityFUNC = checkKeyValidityFUNC;
	exports.redeemAccessKey = redeemAccessKey;

	function getAll(req, res) {
		mainModel.findAndCountAll().then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Seed;

		mainModel.findOne({ where: { "seedField": objectID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[[ req.body.nameField, req.body.seedField, req.body.descriptionField ], 'string'],
			[[ req.body.fundsField, req.body.privilegeField ], 'number']
		])) { return 0; }

		mainModel.findOne({where: { 'seedField': req.body.seedField }}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.seedField)) update.seedField = req.body.seedField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.fundsField)) update.fundsField = req.body.fundsField;
			if (API.methods.isValid(req.body.privilegeField)) update.privilegeField = req.body.privilegeField;
			if (API.methods.isValid(req.body.skipSteamField)) update.skipSteamField = req.body.skipSteamField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function checkKeyValidityFUNC(hash, cb) {
		var queryObj = {
			where: { 'hashField': hash, usedField: false },
			attributes: ["nameField", "seedField", "descriptionField", "skipSteamField", "fundsField", "privilegeField"]
		};

		mainModel.findOne(queryObj).then(function(entry) {
			try {
				var bcrypt = require('bcrypt-nodejs'),
					rSeed = (entry ? entry.seedField : "abc"),
					trueSeed = bcrypt.compareSync(rSeed, hash),
					rObj = { trueSeed: trueSeed, entry: entry };
				return cb(rObj);
			} catch(e) { return cb({}); }
		});
	}

	function checkKeyValidity(req, res) {
		var hash = req.body.hashField;

		if (!API.methods.validateParameter(req, res, [[hash, 'string']], true)) { return 0; }

		checkKeyValidityFUNC(hash, function(obj) {
			if (!API.methods.validate(req, res, [obj.entry], "Invalid key.")) { return 0; }
			API.methods.sendResponse(req, res, obj.trueSeed, "Valid key.", obj.entry);
		});
	}

	function redeemAccessKey(req, res) {
		var hash = req.body.keyHash;
		if (!API.methods.validateParameter(req, res, [[hash, 'string']], true)) { return 0; }

		checkKeyValidityFUNC(hash, function(obj) {
			console.log(hash, obj.trueSeed);
			if (!API.methods.validate(req, res, [obj.trueSeed], "Invalid key.")) { return 0; }

			var PlayerModel = require('./../index.js').getModels().players,
				selfHash = req.playerInfo.hashField;

			PlayerModel.findOne({where: { "hashField": selfHash }}).then(function(self_model) {
				if (!API.methods.validate(req, res, [self_model])) { return 0; }

				var update = {};

				if (obj.entry) {
					if (obj.entry.fundsField) update.networthField = (self_model.networthField += obj.entry.fundsField);
					if (obj.entry.privilegeField) {
						if (obj.entry.privilegeField < self_model.playerPrivilege) update.playerPrivilege = obj.entry.privilegeField;
					}
				}

				mainModel.findOne({ where: { seedField: obj.entry.seedField }}).then(function(keyEntry) {
					keyEntry.update({ usedField: true }).then(function() {
						self_model.update(update).then(function() {
							API.methods.sendResponse(req, res, true, "Key redeemed.", obj.entry);
						});
					});
				});
			});
		});
	}

	function deleteKey(req, res) {
		var objectID = req.params.Seed;
		mainModel.findOne({where: {"seedField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();