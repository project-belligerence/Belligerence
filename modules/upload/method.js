(function(){
	'use strict';

	var
		_ = require('lodash'),
		sharp = require('sharp'),
		multer = require('multer'),

		PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		AWSMethods = require('./../index.js').getMethods().aws,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		settingsObject = {},
		finalFileName = "",

		AWS_ENABLED = AWSMethods.AWS_ENABLED,
		IS_DEV = (process.env.NODE_ENV === "development")
	;

	sharp.cache(false);

	exports.uploadPlayerAvatar = uploadPlayerAvatar;
	exports.uploadPMCAvatar = uploadPMCAvatar;
	exports.uploadModulePicture = uploadModulePicture;
	exports.uploadIntelPicture = uploadIntelPicture;
	exports.getImagesInFolder = getImagesInFolder;
	exports.deleteImageinFolder = deleteImageinFolder;
	exports.deleteContentImageFUNC = deleteContentImageFUNC;

	var
		generalSettings = { thumbName: "thumb", mainName: "main" },
		allowedContent = ['items', 'modifiers', 'stores', 'upgrades', 'advisories', 'objectives', 'maps', 'factions'],
		old_upload_content = ['upgrades', 'objectives', 'advisories', 'factions'],
		has_alpha = ['upgrades', 'objectives', 'advisories']
	;

	function getImagesInFolder(req, res) {
		var getFolderFunction = (AWS_ENABLED ? AWSMethods.getBucketItems : getFoldersLocal),
			folderPath = makeUploadDestination((config.folders.uploads + "/" + config.folders.uploads_images + "/" + req.query.folder + "/" + req.query.type + "/"));

		getFolderFunction(folderPath, function(items) {
			processItems(items, function(folderList) {
				return API.methods.sendResponse(req, res, true, "Returning folders", folderList);
			});
		});

		function getFoldersLocal(path, cb) { require('fs').readdir(path, function(err, items) { return cb(items); }); }

		function processItems(items, cb) {
			var filesList = [];
			items.forEach(function(file) {
				var uniqueFile = file.split("_")[0];
				if (uniqueFile === "thumb") filesList.push(((file.split("_")[1]).split(".")[0]));
			});
			return cb(filesList);
		}
	}

	function deleteImageinFolder(req, res) {
		var params = {
			path: (config.folders.uploads + "/" + config.folders.uploads_images + "/" + req.body.folder + "/" + req.body.type + "/"),
			filename: req.body.id,
			extension: req.body.extension
		};

		deleteContentImageFUNC(params, function() {
			return API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
		});
	}

	function deleteContentImageFUNC(params, cb) {
		var finalPath = makeUploadDestination(params.path),
			filename = (finalPath + "main_" + params.filename + "." + params.extension),
			filenameThumb = (finalPath + "thumb_" + params.filename + "." + params.extension),

			deleteFilesFunction = (AWS_ENABLED ? AWSMethods.deleteBucketObjects : deleteImagesLocal);

		deleteFilesFunction([filename, filenameThumb], cb);
	}

	function deleteImagesLocal(files, cb) {
		var fs = require('fs'),
			main = files[0],
			thumb = files[1];
		fs.stat(main, function(err, stat) {
			if (err === null) {
				fs.unlink(main, function() {
				fs.unlink(thumb, cb);
				});
			}
		});
	}

	function makeUploadDestination(path) {
		if (!(AWS_ENABLED)) return path;
		var nPath = path.split("/"), fPath = [];
		for (var i = 0; i <= (nPath.length - 1); i++) { if (i > 1) fPath.push(nPath[i]); }
		return fPath.join("/");
	}

	function getStorageFolderCb(req, file, cb) { return cb(null, getStorageFolder()); }

	function getStorageFolder() { return ((IS_DEV ? (config.folders.uploads + process.env.TEMP_FOLDER) : process.env.TEMP_FOLDER) + "/"); }

	function uploadPlayerAvatar(req, res) {
		settingsObject = {
			header: 'avatar',
			destination: makeUploadDestination(config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "players/"),
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
			destination: makeUploadDestination(config.folders.uploads + "/" + config.folders.uploads_images + "/avatars/" + "pmc/"),
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
			destination: makeUploadDestination(config.folders.uploads + "/" + config.folders.uploads_images + "/modules/" + "intel/"),
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
			destination: makeUploadDestination(config.folders.uploads + "/" + config.folders.uploads_images + "/modules/" + type + "/"),
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
			getDestinationAWS(req, file, function(destination) {
				var finalDestination = (destination + filtered_file);
				cb(null, finalDestination);
			});
		});
	}

	function getMulterStorage() {
		switch (true) {
			case (AWS_ENABLED): {
				return AWSMethods.getS3Storage(settingsObject, generateS3Path);
			} break;
			default: {
				return multer.diskStorage({ destination: getDestination, filename: filterName });
			} break;
		}
	}

	function handleUploadOld(req, res, done) {
		var upload = multer({ storage: getMulterStorage(), fileFilter: filterFile, limits: { fileSize: settingsObject.maxSizeKb * 1024 }}).single(settingsObject.originalName);

		return upload(req, res, function(err) {
			if (err) return handleError(req, res, err);

			if (AWS_ENABLED) { return done(); }

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
		var storage = multer.diskStorage({ destination: getStorageFolderCb, filename: filterName }),
			upload = multer({storage: storage, fileFilter: filterFile, limits: { fileSize: settingsObject.maxSizeKb * 1024 }}).single(settingsObject.originalName);

		return upload(req, res, function(err) {
			if (err) return handleError(req, res, err);

			var thumbName = (settingsObject.destination + generalSettings.thumbName + "_" + finalFileName),
				mainName = (settingsObject.destination + generalSettings.mainName + "_" + finalFileName),

				cacheFile = (getStorageFolder() + finalFileName);

				createOverlay(function(stream) {
					resizeStream(stream, "mainSize", function(stream_main) {
					resizeStream(stream, "thumbSize", function(stream_thumb) {
							saveStream(stream_main, mainName, function() {
							saveStream(stream_thumb, thumbName, function() {
								removeCached(cacheFile, done);
							});
							});
					});
					});
				});

			function createOverlay(cb) {
				var defaultBackgroundPicture = (config.folders.public + "/" + config.folders.uploads_images + "/upload/upload_bg.jpg");

				return sharp(defaultBackgroundPicture)
					.overlayWith(cacheFile)
					.toBuffer(function(err, stream) {
						if (err) return handleError(req, res, err);
						return cb(stream);
					});
			}

			function resizeStream(stream, size, cb) {
				return sharp(stream)
					.resize(settingsObject[size])
					.toBuffer(function(err, stream_result) {
						if (err) return handleError(req, res, err);
						return cb(stream_result);
					});
			}

			function saveStream(stream, filePath, cb) {
				if (AWS_ENABLED) { AWSMethods.uploadStream(stream, filePath, cb); }
				else {
					sharp(stream)
					.toFile(filePath, function(err) {
						if (err) return handleError(req, res, err);
						return cb();
					});
				}
			}

			function removeCached(target, cb) {
				require('fs').unlink(target, function(err) {
					if (err) return handleError(req, res, err);
					return done();
				});
			}
		});
	}

	function getDestination(req, file, cb) { return cb(null, settingsObject.destination); }
	function getDestinationAWS(req, file, cb) { return cb(settingsObject.destination); }

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