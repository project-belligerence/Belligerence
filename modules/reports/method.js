(function() {
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		ItemModel = require('./../index.js').getModels().items,
		UpgradesModel = require('./../index.js').getModels().upgrades,
		IntelModel = require('./../index.js').getModels().intel,
		StoresModel = require('./../index.js').getModels().stores,
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

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			allowedPostValues: {
				contentValues: ['player', 'pmc', 'intel', 'item', 'store', 'upgrade', 'comment'],
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
				case "item": { return ItemModel; }
				case "upgrade": { return UpgradesModel; }
				case "intel": { return IntelModel; }
				case "player": { return PlayerModel; }
				case "store": { return StoresModel; }
				case "comments": { return CommentsModel; }
				case "pmc": { return PMCModel; }
			}
		})(req.body.content);

		PlayerModel.findOne({where:{hashField: req.playerInfo.hashField}}).then(function(player) {
			if(!API.methods.validate(req, res, [player])) { return 0; }

			subjectModel.findOne({where:{hashField: req.body.reported}}).then(function(subject) {
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

})();