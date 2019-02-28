(function(){
	'use strict';

	/*
		Credits to github.com/atomicframeworks/express-s3-router for some of the S3 methods.
	*/

	var _ = require('lodash'),
		AWS = require('aws-sdk'),
		s3Storage = require('multer-sharp-s3'),

		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		s3 = new AWS.S3(),

		AWS_ENABLED = _.isString(process.env.AWS_ACCESS_KEY_ID);

	AWS.config.update(config.db.aws);

	exports.getS3File = getS3File;
	exports.getS3Storage = getS3Storage;
	exports.uploadStream = uploadStream;
	exports.getBucketItems = getBucketItems;
	exports.deleteBucketObjects = deleteBucketObjects;
	exports.AWS_ENABLED = AWS_ENABLED;

	// ===============================================================

	function getBucketItems(path, cb) {
		var params = { Bucket: config.db.aws.bucket, Marker: path },
			fileList = [];

		s3.listObjects(params, function(err, data) {
			if (err) return console.log(err, err.stack);

			for (var i = (data.Contents.length - 1); i >= 0; i--) {
				var file = data.Contents[i];

				if (file.Key) {
					var fileName = _.last(file.Key.split("/"));
					if (allowedType(fileName)) fileList.push(fileName);
				}
			}
			return cb(fileList);
		});

		function allowedType(file) {
			var allowedTypes = ["jpeg", "jpg", "png", "webp", "gif"],
				mimeType = _.last(file.split("."));
			return API.methods.inArray(mimeType, allowedTypes);
		}
	}

	function deleteBucketObjects(keys, cb) {
		var keyObjs = [];
		for (var i = keys.length - 1; i >= 0; i--) { keyObjs.push(new keyObj(keys[i])); }

		var params = { Bucket: config.db.aws.bucket, Delete: { Objects: keyObjs, Quiet: false } };

		s3.deleteObjects(params, function(err, data) {
			if (err) return console.log(err, err.stack);
			return cb(data);
		});

		function keyObj(key) { return { Key: key }; }
	}

	function uploadStream(stream, key, cb) {
		var params = { Bucket: config.db.aws.bucket, Key: key, Body: stream };
		return s3.upload(params, cb);
	}

	function getS3File(req, res) {
		var fileKey = mountPath(req.params, req.route),
			params = { Bucket: config.db.aws.bucket, Key: fileKey };

		s3.getObject(params)
			.createReadStream()
			.on('error', handleError)
			.pipe(res);

		function handleError (err) { res.status(config.enums.response_status.not_found).send(err); }
	}

	function getS3Storage(settings, keyFunc) {
		return s3Storage({
			s3: s3,
			Key: keyFunc,
			Bucket: config.db.aws.bucket,
			ACL: 'public-read',
			multiple: true,
			toFormat: {
				type: (settings.alpha ? "png" : "jpeg"),
				options: {
					progressive: true,
					quality: settings.quality
				},
			},
			resize: [ new resizeObject("main", settings), new resizeObject("thumb", settings) ]
		});
	}

	function resizeObject(m, s) {
		var sProp = s[((m === "thumb") ? "thumbSize" : "mainSize")];
		return {
			prefix: m,
			delimiter: "_",
			width: (sProp * s.aspectRatio[0]),
			height: (sProp * s.aspectRatio[1])
		};
	}

	function mountPath(p, r) {
		var key = p.FilePath += (p['0'] || '');
		if (r.path.slice(-1) === '/' && key.slice(-1) !== '/') key += '/';
		return key;
	}

})();