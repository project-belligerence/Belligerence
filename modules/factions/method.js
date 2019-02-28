(function(){
	'use strict';

	var FactionsModel = require('./../index.js').getModels().factions,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),
		UpgradesMethods = require('./../index.js').getMethods().upgrades,

		moduleName = "Factions",
		mainModel = FactionsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.duplicateEntry = duplicateEntry;
	exports.getDoctrines = getDoctrines;
	exports.getPolicies = getPolicies;
	exports.recoverFactionAssetsFunc = recoverFactionAssetsFunc;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'demonym', 'description', 'loadout', 'side', 'assets', 'current_assets', 'tech', 'training', 'munificence', 'organization', 'isr', 'tactics', 'policy', 'MapId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {}, _ = require("lodash");

				if (API.methods.isValid(req.query.qId)) { object.id = { $like: "%" + req.query.qId + "%" }; }
				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qDemonym)) { object.demonym = { $like: "%" + req.query.qDemonym + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.descripttion = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qLoadout)) { object.loadout = { $like: "%" + req.query.qLoadout + "%" }; }
				if (API.methods.isValid(req.query.qSide)) { object.side = { $like: "%" + req.query.qSide + "%" }; }

				if (API.methods.isValid(req.query.qAssets)) { req.query.qAssets = JSON.parse(req.query.qAssets); object.assets = { $between: [(req.query.qAssets.min || 0), (req.query.qAssets.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qCurrentAssets)) { req.query.qCurrentAssets = JSON.parse(req.query.qCurrentAssets); object.current_assets = { $between: [(req.query.qCurrentAssets.min || 0), (req.query.qCurrentAssets.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qTech)) { req.query.qTech = JSON.parse(req.query.qTech); object.tech = { $between: [(req.query.qTech.min || 0), (req.query.qTech.max || 10)]}; }
				if (API.methods.isValid(req.query.qTraining)) { req.query.qTraining = JSON.parse(req.query.qTraining); object.training = { $between: [(req.query.qTraining.min || 0), (req.query.qTraining.max || 10)]}; }
				if (API.methods.isValid(req.query.qMunificence)) { req.query.qMunificence = JSON.parse(req.query.qMunificence); object.munificence = { $between: [(req.query.qMunificence.min || 0), (req.query.qMunificence.max || 10)]}; }
				if (API.methods.isValid(req.query.qOrganization)) { req.query.qOrganization = JSON.parse(req.query.qOrganization); object.organization = { $between: [(req.query.qOrganization.min || 0), (req.query.qOrganization.max || 10)]}; }
				if (API.methods.isValid(req.query.qIsr)) { req.query.qIsr = JSON.parse(req.query.qIsr); object.isr = { $between: [(req.query.qIsr.min || 0), (req.query.qIsr.max || 10)]}; }

				if (API.methods.isValid(req.query.qTactics)) { object.tactics = { $like: "%" + req.query.qTactics + "%" }; }
				if (API.methods.isValid(req.query.qPolicy)) { object.policy = { $like: "%" + req.query.qPolicy + "%" }; }
				if (API.methods.isValid(req.query.qAreasInterest)) { object.areas_of_interest = { $like: "%" + req.query.qAreasInterest + "%" }; }
				if (API.methods.isValid(req.query.qHome)) { object.MapId = { $like: "%" + req.query.qHome + "%" }; }

				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function recoverFactionAssetsFunc(callback) {
		var ParticipantsModel = require('./../index.js').getModels().participants;

		ParticipantsModel.findAll({
			where: { "statusField": 0, "activeField": true },
			attributes: ["FactionId"]
		}).then(function(active_participants) {
			var activeParticipantsId = [], i;

			for (i = active_participants.length - 1; i >= 0; i--) {
				activeParticipantsId.push(active_participants[i].FactionId);
			}

			mainModel.findAll({ where: { "id": { $notIn: activeParticipantsId } }}).then(function(inactive_factions) {
				Promise.all(inactive_factions.map(function(faction) {
					var recoverValue = ((faction.assetsField / 100) * config.numbers.modules.factions.assetDailyRecoverPercent),
						finalAssets = (Math.min(faction.assetsField, (faction.currentAssetsField + recoverValue)));

					return faction.update({ "currentAssetsField": finalAssets });
				})).then(function() { return callback(); });
			});
		});
	}

	function getPolicies(req, res) {
		var configSides = mainModel.getPolicies(), rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getDoctrines(req, res) {
		var configSides = mainModel.getDoctrines(), rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			UpgradesMethods.getAssociatedUpgrades([entry], function(nEntries) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
			});
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.demonymField], 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.classnameField, req.body.descriptionField], 'string', config.numbers.modules.players.bioLength],
			[[req.body.sideField, req.body.assetsField, req.body.techField, req.body.trainingField, req.body.isrField, req.body.tacticsField, req.body.policyField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.nameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.demonymField)) update.demonymField = req.body.demonymField;

			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.loadoutField)) update.loadoutField = req.body.loadoutField;
			if (API.methods.isValid(req.body.sideField)) update.sideField = req.body.sideField;
			if (API.methods.isValid(req.body.assetsField)) update.assetsField = req.body.assetsField;
			if (API.methods.isValid(req.body.currentAssetsField)) update.currentAssetsField = req.body.currentAssetsField;
			if (API.methods.isValid(req.body.techField)) update.techField = req.body.techField;
			if (API.methods.isValid(req.body.trainingField)) update.trainingField = req.body.trainingField;
			if (API.methods.isValid(req.body.isrField)) update.isrField = req.body.isrField;
			if (API.methods.isValid(req.body.tacticsField)) update.tacticsField = req.body.tacticsField;
			if (API.methods.isValid(req.body.munificenceField)) update.munificenceField = req.body.munificenceField;
			if (API.methods.isValid(req.body.policyField)) update.policyField = req.body.policyField;

			if (API.methods.isValid(req.body.requiredUpgrades)) {
				if (req.body.requiredUpgrades === []) {
					update.requiredUpgradesField = [];
				} else { update.requiredUpgradesField = UpgradesMethods.loopThroughRequired(req.body.requiredUpgrades); }
			}

			if (API.methods.isValid(req.body.blacklistedUpgrades)) {
				if (req.body.blacklistedUpgrades === []) {
					update.blacklistedUpgradesField = [];
				} else { update.blacklistedUpgradesField = UpgradesMethods.loopThroughRequired(req.body.blacklistedUpgrades); }
			}

			if (API.methods.isValid(req.body.areasOfInterest)) update.areasOfInterest = req.body.areasOfInterest;
			if (API.methods.isValid(req.body.MapId)) update.MapId = ((req.body.MapId > 0) ? req.body.MapId : null);

			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.demonymField], 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.classnameField, 'string', config.numbers.modules.players.bioLength],
			[[req.body.sideField, req.body.assetsField, req.body.techField, req.body.trainingField, req.body.isrField, req.body.tacticsField, req.body.policyField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.demonymField)) update.demonymField = req.body.demonymField;

			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.loadoutField)) update.loadoutField = req.body.loadoutField;
			if (API.methods.isValid(req.body.sideField)) update.sideField = req.body.sideField;
			if (API.methods.isValid(req.body.assetsField)) update.assetsField = req.body.assetsField;
			if (API.methods.isValid(req.body.currentAssetsField)) update.currentAssetsField = req.body.currentAssetsField;
			if (API.methods.isValid(req.body.techField)) update.techField = req.body.techField;
			if (API.methods.isValid(req.body.trainingField)) update.trainingField = req.body.trainingField;
			if (API.methods.isValid(req.body.isrField)) update.isrField = req.body.isrField;
			if (API.methods.isValid(req.body.munificenceField)) update.munificenceField = req.body.munificenceField;
			if (API.methods.isValid(req.body.tacticsField)) update.tacticsField = req.body.tacticsField;
			if (API.methods.isValid(req.body.policyField)) update.policyField = req.body.policyField;

			if (API.methods.isValid(req.body.requiredUpgrades)) {
				if (req.body.requiredUpgrades === []) {
					update.requiredUpgradesField = [];
				} else { update.requiredUpgradesField = UpgradesMethods.loopThroughRequired(req.body.requiredUpgrades); }
			}

			if (API.methods.isValid(req.body.blacklistedUpgrades)) {
				if (req.body.blacklistedUpgrades === []) {
					update.blacklistedUpgradesField = [];
				} else { update.blacklistedUpgradesField = UpgradesMethods.loopThroughRequired(req.body.blacklistedUpgrades); }
			}

			if (API.methods.isValid(req.body.areasOfInterest)) update.areasOfInterest = req.body.areasOfInterest;
			if (API.methods.isValid(req.body.MapId)) update.MapId = ((req.body.MapId > 0) ? req.body.MapId : null);

			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			var OBJECT_FUNC_QUERY = { where: {} };
			OBJECT_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }, { 'hashField': req.body.hashField }];

			mainModel.findOne(OBJECT_FUNC_QUERY).then(function(duplicate) {
				if (!API.methods.validate(req, res, [(duplicate ? (entry.id === duplicate.id) : true)], config.messages().entry_exists(req.body.nameField))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), entry);
					});
				});
			});
		});
	}

	function duplicateEntry(req, res) {
		mainModel.findOne({ where: { "hashField": req.params.Hash }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var _ = require("lodash"),
				entryData = entry.dataValues,
				update = _.omit(entryData, ["id", "hashField", "createdAt", "updatedAt", "requiredUpgradesField", "blacklistedUpgradesField"]);

			update.nameField += " (copy)";
			if (entryData.areasOfInterest) update.areasOfInterest = entryData.areasOfInterest.split(",");

			update.currentAssetsField = update.assetsField;

			if (API.methods.isValid(entryData.requiredUpgradesField)) update.requiredUpgradesField = API.methods.getDoublePseudoArray(entryData.requiredUpgradesField);
			if (API.methods.isValid(entryData.blacklistedUpgradesField)) update.blacklistedUpgradesField = API.methods.getDoublePseudoArray(entryData.blacklistedUpgradesField);

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(nEntry) {

					var fs = require('fs'),
						destination = config.folders.uploads + "/" + config.folders.uploads_images + "/" + config.folders.modules + "/" + "factions/",
						filename = destination + "main_" + req.params.Hash + ".jpg",
						filenameThumb = destination + "thumb_" + req.params.Hash + ".jpg",
						filename_new = destination + "main_" + nEntry.hashField + ".jpg",
						filenameThumb_new = destination + "thumb_" + nEntry.hashField + ".jpg";

					fs.stat(filename, function(err, stat) {
						if (err === null) {
							fs.createReadStream(filename).pipe(fs.createWriteStream(filename_new));
							fs.createReadStream(filenameThumb).pipe(fs.createWriteStream(filenameThumb_new));
						}

						API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
					});
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash,
			fs = require('fs'),
			UploadMethods = require('./../index.js').getMethods().upload;

		mainModel.findOne({where: { "hashField": objectID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var destination = (config.folders.uploads + "/" + config.folders.uploads_images + "/" + config.folders.modules + "/" + "factions/"),
				params = { path: destination, filename: req.params.Hash, extension: ".jpg" };

			UploadMethods.deleteContentImageFUNC(params, function() {
				entry.destroy().then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
				});
			});
		});
	}

})();