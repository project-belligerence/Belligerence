(function(){
	'use strict';

	var
		PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),
		_ = require('lodash'),
		sharp = require('sharp'),
		multer = require('multer'),
		settingsObject = {},
		finalFileName = ""
	;

	sharp.cache(false);

	exports.uploadPlayerAvatar = uploadPlayerAvatar;
	exports.uploadPMCAvatar = uploadPMCAvatar;
	exports.uploadModulePicture = uploadModulePicture;

	var
		generalSettings = {
			thumbName: "thumb",
			mainName: "main"
		},
		allowedContent = ['items', 'modifiers', 'stores', 'upgrades']
	;

	function uploadPlayerAvatar(req, res) {
		settingsObject = {
			header: 'avatar',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "players/",
			originalName: 'avatar_picture',
			quality: 90,
			mainSize: 250,
			thumbSize: 64,
			uploadName: req.playerInfo.hashField,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUpload(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function uploadPMCAvatar(req, res) {
		settingsObject = {
			header: 'avatar',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "pmc/",
			originalName: 'avatar_picture',
			quality: 90,
			mainSize: 350,
			thumbSize: 64,
			uploadName: req.playerInfo.PMC.hashField,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUpload(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function uploadModulePicture(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.params.Type, 'string', allowedContent],
			[req.params.Hash, 'string']
		], true)) { return 0; }

		var type = req.params.Type,
			hash = req.params.Hash;

		settingsObject = {
			header: 'module',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/modules/" + type + "/",
			originalName: 'module_picture',
			quality: 90,
			mainSize: 350,
			thumbSize: 64,
			uploadName: hash,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUpload(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function handleUpload(req, res, done) {
		var
			storage = multer.diskStorage({destination: makeDestination, filename: filterName}),
			upload = multer({storage: storage, fileFilter: filterFile, limits: { fileSize: settingsObject.maxSizeKb * 1024 }}).single(settingsObject.originalName)
		;

		return upload(req, res, function(err) {
			if (err) return handleError(req, res, err);

			return sharp(settingsObject.destination + finalFileName)
				.resize(settingsObject.thumbSize, settingsObject.thumbSize)
				.toFile(settingsObject.destination + generalSettings.thumbName + "_" + finalFileName , function(err) {
					if (err) return handleError(req, res, err);

					return sharp(settingsObject.destination + finalFileName)
						.resize(settingsObject.mainSize, settingsObject.mainSize)
						.quality(settingsObject.quality)
						.toFile(settingsObject.destination + generalSettings.mainName + "_" + finalFileName , function(err) {
							if (err) return handleError(req, res, err);

							require('fs').unlink(settingsObject.destination + finalFileName, function(err) {
								if (err) throw Error(err);
								return done();
							});
					});
			});
		});
	}

	function makeDestination(req, file, cb) {
		return cb(null, settingsObject.destination);
	}

	function filterName(req, file, cb) {
		var md5	= require("md5"),
			randomHash = (md5(Math.random(999))),
			newFileName = (function(v) {
				switch(v) {
					case "avatar": { return (settingsObject.uploadName + "." + "jpg"); }
					default: { return (settingsObject.uploadName + "." + "jpg"); }
				}
			})(settingsObject.header);

			finalFileName = newFileName;

		return cb(null, newFileName);
	}

	function filterFile(req, file, cb) {
		var fileType = file.mimetype.split("/")[1];

		if (_.indexOf(settingsObject.validTypes, fileType) < 0) { return cb("LIMIT_UNEXPECTED_TYPE", false); }

		return cb(null, true);
	}

	function handleError(req, res, err) {
		console.log(err);
		var errCode = (function() {
			switch((err.code || err)) {
				case "LIMIT_UNEXPECTED_FILE": { return "wrong_file"; }
				case "LIMIT_UNEXPECTED_TYPE": { return "wrong_type"; }
				case "LIMIT_FILE_SIZE": { return "file_size"; }
				default: { return "failure"; }
			}
		})();
		return API.methods.sendResponse(req, res, false, "ERROR: " + config.messages().modules.uploads[errCode]);
	}

})();