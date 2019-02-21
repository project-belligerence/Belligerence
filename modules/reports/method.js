(function() {
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		ItemModel = require('./../index.js').getModels().items,
		UpgradesModel = require('./../index.js').getModels().upgrades,
		IntelModel = require('./../index.js').getModels().intel,
		StoresModel = require('./../index.js').getModels().stores,
		MapsModel = require('./../index.js').getModels().maps,
		LocationsModel = require('./../index.js').getModels().locations,
		FactionsModel = require('./../index.js').getModels().factions,
		ObjectivesModel = require('./../index.js').getModels().objectives,
		ConflictsModel = require('./../index.js').getModels().conflicts,
		MissionsModel = require('./../index.js').getModels().missions,
		CommentsModel = require('./../index.js').getModels().comments,
		ReportsModel = require('./../index.js').getModels().reports,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "",
		mainModel = ReportsModel;

	exports.postReport = postReport;
	exports.get = get;
	exports.getAll = getAll;
	exports.toggleResolved = toggleResolved;
	exports.deleteReport = deleteReport;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			allowedPostValues: {
				contentValues: ['player', 'pmc', 'intel', 'item', 'store', 'upgrade', 'comment', "map", "location", "faction", "objective", "conflict", "mission"],
				typeValues: ['harassment', 'rules', 'illegal', 'bug']
			},
			generateWhereQuery:	function(req) {
				var object = {};

				object.resolved = ((req.query.qResolved) === "true");

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function toggleResolved(req, res) {
		var report = req.params.Hash;

		mainModel.findOne({where: {hashField: report}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			entry.update({resolvedField: !(entry.resolvedField)}).then(function(nEntry){
				API.methods.sendResponse(req, res, true, config.messages().entry_updated, nEntry);
			});
		});
	}

	function postReport(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[req.body.reason, 'string', 144],
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
			[req.body.content, 'string', queryValues(req).allowedPostValues.contentValues],
			[req.body.reported, 'string']
		], true)) { return 0; }

		var subjectModel = (function(v) {
			switch (v) {
				case "item": { return ItemModel; } break;
				case "upgrade": { return UpgradesModel; } break;
				case "intel": { return IntelModel; } break;
				case "player": { return PlayerModel; } break;
				case "store": { return StoresModel; } break;
				case "comments": { return CommentsModel; } break;
				case "pmc": { return PMCModel; } break;
				case "map": { return MapsModel; } break;
				case "location": { return LocationsModel; } break;
				case "faction": { return FactionsModel; } break;
				case "objective": { return ObjectivesModel; } break;
				case "conflict": { return ConflictsModel; } break;
				case "mission": { return MissionsModel; } break;
			}
		})(req.body.content);

		PlayerModel.findOne({where:{hashField: req.playerInfo.hashField}}).then(function(player) {
			if(!API.methods.validate(req, res, [player])) { return 0; }

			var subjectQuery = {where: {}};
			subjectQuery.where[req.body.hashProperty] = req.body.reported;

			subjectModel.findOne(subjectQuery).then(function(subject) {
				if(!API.methods.validate(req, res, [subject])) { return 0; }

				mainModel.findOne({where:{issuerHash: req.playerInfo.hashField, reportedHash: req.body.reported}}).then(function(report) {
					if(!API.methods.validate(req, res, [!(report)], config.messages().modules.reports.duplicate)) { return 0; }

					var object = {
						reasonField: req.body.reason,
						typeField: req.body.type,
						contentField: req.body.content,
						resolvedField: false,
						issuerHash: player.hashField,
						reportedHash: req.body.reported
					};

					mainModel.create(object).then(function(entry) {
						API.methods.sendResponse(req, res, true, "The report has been filed.", 'entry');
					});
				});
			});
		});
	}

	function deleteReport(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {'hashField': objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			entry.destroy().then(function(rowDeleted) {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();