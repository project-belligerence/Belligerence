(function(){
	'use strict';

	var
		_ = require('lodash'),
		sharp = require('sharp'),
		multer = require('multer'),
		s3Storage = require('multer-sharp-s3'),

		aws = require('aws-sdk'),
		awsConfig = {
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			region: process.env.AWS_REGION
		},
		s3 = new aws.S3(),

		PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		settingsObject = {},
		finalFileName = ""
	;

	aws.config.update(awsConfig);
	sharp.cache(false);

	exports.uploadPlayerAvatar = uploadPlayerAvatar;
	exports.uploadPMCAvatar = uploadPMCAvatar;
	exports.uploadModulePicture = uploadModulePicture;
	exports.uploadIntelPicture = uploadIntelPicture;
	exports.getImagesInFolder = getImagesInFolder;
	exports.deleteImageinFolder = deleteImageinFolder;

	var
		generalSettings = {
			thumbName: "thumb",
			mainName: "main"
		},
		allowedContent = ['items', 'modifiers', 'stores', 'upgrades', 'advisories', 'objectives', 'maps', 'factions'],
		old_upload_content = ['upgrades', 'objectives', 'advisories', 'factions'],
		has_alpha = ['upgrades', 'objectives', 'advisories']
	;

	function getImagesInFolder(req, res) {
		var fs = require('fs'),
			pathArg = config.folders.uploads + "/" + config.folders.uploads_images + "/" + req.query.folder + "/" + req.query.type + "/",
			filesList = [];

		fs.readdir(pathArg, function(err, items) {
			items.forEach(function(file) {
				var uniqueFile = file.split("_")[0];
				if (uniqueFile === "thumb") filesList.push(((file.split("_")[1]).split(".")[0]));
			});
			return API.methods.sendResponse(req, res, true, "Returning folders", filesList);
		});
	}

	function deleteImageinFolder(req, res) {
		var fs = require('fs'),
			pathArg = config.folders.uploads + "/" + config.folders.uploads_images + "/" + req.body.folder + "/" + req.body.type + "/",
			filename = pathArg + "main_" + req.body.id + "." + req.body.extension,
			filenameThumb = pathArg + "thumb_" + req.body.id + "." + req.body.extension;

		fs.stat(filename, function(err, stat) {
			if (err === null) {
				fs.unlink(filename);
				fs.unlink(filenameThumb);
			}
			return API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
		});
	}

	function uploadPlayerAvatar(req, res) {
		settingsObject = {
			header: 'avatar',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "players/",
			originalName: 'avatar_picture',
			quality: 85,
			mainSize: 250,
			thumbSize: 64,
			aspectRatio: [1, 1],
			uploadName: req.playerInfo.hashField,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUploadOld(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function uploadPMCAvatar(req, res) {
		settingsObject = {
			header: 'avatar',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "pmc/",
			originalName: 'avatar_picture',
			quality: 85,
			mainSize: 350,
			thumbSize: 64,
			aspectRatio: [1, 1],
			uploadName: req.playerInfo.PMC.hashField,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUploadOld(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function uploadIntelPicture(req, res) {
		settingsObject = {
			header: 'intel',
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/modules/" + "intel/",
			originalName: 'intel_picture',
			quality: 85,
			mainSize: 350,
			thumbSize: 64,
			aspectRatio: [1, 1],
			uploadName: req.params.intelHash,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		handleUploadOld(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function uploadModulePicture(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.params.Type, 'string', allowedContent],
			[req.params.Hash, 'string']
		], true)) { return 0; }

		var type = req.params.Type,
			hash = req.params.Hash,
			uploadFunction = (API.methods.inArray(type, old_upload_content) ? handleUploadOld : handleUpload);

		settingsObject = {
			header: 'module',
			alpha: (API.methods.inArray(type, has_alpha)),
			destination: config.folders.uploads + "/" + config.folders.uploads_images + "/modules/" + type + "/",
			originalName: 'module_picture',
			quality: 100,
			mainSize: 350,
			thumbSize: 64,
			aspectRatio: [1, 1],
			uploadName: hash,
			validTypes: ['jpeg', 'png'],
			maxSizeKb: 1024
		};

		switch (type) {
			case "factions": {
				settingsObject.aspectRatio = [2,1];
				settingsObject.alpha = true;
			} break;
		}

		uploadFunction(req, res, function() {
			return API.methods.sendResponse(req, res, true, config.messages().modules.uploads.success);
		});
	}

	function generateS3Path(req, file, cb) {
		filterNameAWS(req, file, function(filtered_file) {
			makeDestinationAWS(req, file, function(destination) {
				var finalDestination = (destination + filtered_file);
				console.log(">>>>", finalDestination);
				cb(null, finalDestination);
			});
		});
	}

	function getMulterStorage() {
		switch (true) {
			case (_.isString(process.env.AWS_ACCESS_KEY_ID)): {

					var storageObject = s3Storage({
						s3: s3,
						Key: generateS3Path,
						Bucket: process.env.S3_BUCKET_NAME,
						ACL: 'public-read',
						multiple: true,
						normalize: true,
						toFormat: {
							type: (settingsObject.alpha ? "png" : "jpeg"),
							options: {
								progressive: true,
								quality: settingsObject.quality
							},
						},
						resize: [
							{
								prefix: "main",
								delimiter: "_",
								width: (settingsObject.mainSize * settingsObject.aspectRatio[0]),
								height: (settingsObject.mainSize * settingsObject.aspectRatio[1])
							},
							{
								prefix: "thumb",
								delimiter: "_",
								width: (settingsObject.thumbSize * settingsObject.aspectRatio[0]),
								height: (settingsObject.thumbSize * settingsObject.aspectRatio[1])
							}
						]
					});

				return storageObject;

			} break;
			default: {
				return multer.diskStorage({ destination: makeDestination, filename: filterName });
			} break;
		}
	}

	function handleUploadOld(req, res, done) {
		var upload = multer({ storage: getMulterStorage(), fileFilter: filterFile, limits: { fileSize: settingsObject.maxSizeKb * 1024 }}).single(settingsObject.originalName);

		return upload(req, res, function(err) {
			if (err) return handleError(req, res, err);

			if (_.isString(process.env.AWS_ACCESS_KEY_ID)) { return done(); }

			return sharp(settingsObject.destination + finalFileName)
				.resize((settingsObject.thumbSize * (settingsObject.aspectRatio[0])), (settingsObject.thumbSize * settingsObject.aspectRatio[1]))
				.toFile(settingsObject.destination + generalSettings.thumbName + "_" + finalFileName , function(err) {
					if (err) return handleError(req, res, err);

					return sharp(settingsObject.destination + finalFileName)
						.resize((settingsObject.mainSize * settingsObject.aspectRatio[0]), (settingsObject.mainSize * settingsObject.aspectRatio[1]))
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

	function handleUpload(req, res, done) {
		var upload = multer({storage: getMulterStorage(), fileFilter: filterFile, limits: { fileSize: settingsObject.maxSizeKb * 1024 }}).single(settingsObject.originalName),
			defaultBackgroundPicture = "public/images/content/default_bg.png"
		;

		return upload(req, res, function(err) {
			if (err) return handleError(req, res, err);

			if (_.isString(process.env.AWS_ACCESS_KEY_ID)) { return done(); }

			return sharp(defaultBackgroundPicture)
				.overlayWith((settingsObject.destination + finalFileName))
				.toBuffer(function(err, data) {
					return sharp(data)
						.resize(settingsObject.thumbSize)
						.toFile((settingsObject.destination + generalSettings.thumbName + "_" + finalFileName), function(err) {
							if (err) return handleError(req, res, err);
							return sharp(defaultBackgroundPicture)
								.overlayWith((settingsObject.destination + finalFileName))
								.resize(settingsObject.mainSize)
								.toFile(settingsObject.destination + generalSettings.mainName + "_" + finalFileName , function(err) {
									if (err) return handleError(req, res, err);

									require('fs').unlink((settingsObject.destination + finalFileName), function(err) {
										if (err) throw Error(err);
										return done();
									});
								});
						});
				});
		});
	}

	function makeDestination(req, file, cb) { return cb(null, settingsObject.destination); }
	function makeDestinationAWS(req, file, cb) { return cb(settingsObject.destination); }

	function filterNameAWS(req, file, cb) {
		var newFileName = (function(v, a) {
				var fFormat = a ? "png" : "jpg";
				switch(v) {
					case "avatar": { return (settingsObject.uploadName + "." + fFormat); }
					default: { return (settingsObject.uploadName + "." + fFormat); }
				}
			})(settingsObject.header, settingsObject.alpha);

			finalFileName = newFileName;

		return cb(newFileName);
	}

	function filterName(req, file, cb) {
		var md5	= require("md5"),
			randomHash = (md5(Math.random(999))),
			newFileName = (function(v, a) {
				var fFormat = a ? "png" : "jpg";
				switch(v) {
					case "avatar": { return (settingsObject.uploadName + "." + fFormat); }
					default: { return (settingsObject.uploadName + "." + fFormat); }
				}
			})(settingsObject.header, settingsObject.alpha);

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
		// return API.methods.sendResponse(req, res, false, "ERROR: " + config.messages().modules.uploads[errCode]);
		return API.methods.sendResponse(req, res, false, "" + err + ".");
	}

})();