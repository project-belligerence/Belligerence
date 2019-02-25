(function() {
	/* jshint shadow:true */
	'use strict';

	// API ROUTES
	var	config = require('../config.js'),
		PlayerModel = require('./../modules/index.js').getModels().players,
		PMCModel = require('./../modules/index.js').getModels().pmc,
		PlayerItems = require('./../modules/index.js').getModels().player_items,
		PMCItems = require('./../modules/index.js').getModels().pmc_items,
		jwt = require('jsonwebtoken'),

		sentMessage, sentResponse;

	exports.methods = {
		doLog: doLog,
		validate: validate,
		authenticateToken: authenticateToken,
		checkToken: checkToken,
		sendResponse: sendResponse,
		getType: getType,
		toUpperFirstChar: toUpperFirstChar,
		toCamelCase: toCamelCase,
		isValidJSON: isValidJSON,
		findInArray: findInArray,
		inArray: inArray,
		sumArray: sumArray,
		minMax: minMax,
		minMaxArray: minMaxArray,
		dateTimeDifference: dateTimeDifference,
		getRandomInt: getRandomInt,
		getSideName: getSideName,
		getPseudoArray: getPseudoArray,
		setPseudoArray: setPseudoArray,
		setDoublePseudoArray: setDoublePseudoArray,
		getDoublePseudoArray: getDoublePseudoArray,
		validatePlayerPrivilege: validatePlayerPrivilege,
		validatePlayerPrivilegeFunc: validatePlayerPrivilegeFunc,
		validatePlayerPMCTier: validatePlayerPMCTier,
		validatePlayerPMCTierFunc: validatePlayerPMCTierFunc,
		getBannedStatus: getBannedStatus,
		cloneArray: cloneArray,
		addIfNew: addIfNew,
		isValid: isValid,
		arrayLike: arrayLike,
		isUndefinedOrNull: isUndefinedOrNull,
		generateRegexp: generateRegexp,
		limitString: limitString,
		sharedArrayFromArray: sharedArrayFromArray,
		excludeArrayFromArray: excludeArrayFromArray,
		retrieveModelsRecursive: retrieveModelsRecursive,
		getMainEntity: getMainEntity,
		validateParameter: validateParameter,
		validateEntriesRecursive: validateEntriesRecursive,
		removeIndexFromArray: removeIndexFromArray,
		generateRawQuery: generateRawQuery,
		getBoolean: getBoolean,
		boolToString: boolToString,
		generatePaginatedQuery: generatePaginatedQuery
	};

	function getPlayerObject(hash) {
		return {
			where: { 'hashField': hash },
			include: [ { model: PMCModel, as: 'PMC', attributes: ['id', 'hashField', 'PMCPrestige', 'sideField'] } ]
		};
	}

	function checkToken(req, res, next) {
		var token = ((req.body.token) || (req.query.token) || (req.headers['x-access-session-token']));

		if (token) {
			jwt.verify(token, config.db.secretKey, function(err, decoded) {
				if (err) {
					var r_status = config.enums.response_status;
					return sendResponse(req, res, false, err.message, '', r_status.forbidden, r_status.sub_code.bad_token);
					// res.status(403).json(new config.methods.generateResponse(err.message, '', false));
				} else {
					req.decoded = decoded;
					PlayerModel.findOne(getPlayerObject(decoded.hash)).then(function(player) {
						if (!validate(req, res, [player], config.messages().bad_permission, '', 403)) { return 0; }
						req.playerInfo = player.dataValues;
						return next();
					});
				}
			});
		} else {
			// USER IS A GUEST
			req.playerInfo = { hashField: '123456789', id: 0 };

			return next();
		}
	}

	function authenticateToken(req, res, next) {
		if (req.playerInfo) return next();

		var token = ((req.body.token) || (req.query.token) || (req.headers['x-access-session-token']));

		if (token) {
			jwt.verify(token, config.db.secretKey, function(err, decoded) {
				if (err) {
					var r_status = config.enums.response_status;
					return sendResponse(req, res, false, err.message, '', r_status.forbidden, r_status.sub_code.bad_token);
					// res.status(403).json(new config.methods.generateResponse(err.message, '', false));
				} else {
					req.decoded = decoded;
					PlayerModel.findOne(getPlayerObject(decoded.hash)).then(function(player) {
					if (!validate(req, res, [player], config.messages().bad_permission, '', 403)) { return 0; }
						req.playerInfo = player.dataValues;
						player.validateSecuritySettings(req, function(valid) {
							if (!validate(req, res, [valid], config.messages().bad_permission, '', 403)) { return 0; }
							req.playerInfo = player.dataValues;
							return next();
						});
					});
				}
			});
		} else {
			var r_status = config.enums.response_status;
			return sendResponse(req, res, false, 'No token provided.', '', r_status.forbidden, r_status.sub_code.no_token);
		}
	}

	function getBannedStatus(req, res, next) {
		var thisHash = req.playerInfo.hashField,
			BansModel = require('./../modules/index.js').getModels().bans;

		BansModel.findAll({where: {"bannedHash": thisHash}}).then(function(entries) {
			if (entries.length > 0) {
				for (var i=0; i < entries.length; i++) {
					if (entries[i].activeField === true) {
						var banObject = {
							reason: entries[i].reasonField,
							expiration: entries[i].expirationDate
						};
						var r_status = config.enums.response_status;
						return sendResponse(req, res, false, config.messages().banned, banObject, r_status.unauthorized, r_status.sub_code.banned);
					}
					return next();
				}
			} else { return next(); }
		});
	}

	function validatePlayerPrivilege(required) {
		return function(req, res, next) {
			if (!validate(req, res, [req.playerInfo.playerPrivilege <= required], config.messages().bad_permission, '', 403)) { return 0; }
			return next();
		};
	}

	function getMainEntity(req) {
		var hasPMC = (req.playerInfo.PMC || false),
			entityType = (hasPMC ? "pmc" : "player"),
			entityTypeName = (hasPMC ? "PMC" : "Player"),
			entityModel = (hasPMC ? PMCModel : PlayerModel),
			entityInventory = (hasPMC ? PMCItems : PlayerItems),
			entity = (hasPMC ? req.playerInfo.PMC : req.playerInfo),
			entityHash = entity.hashField,
			entitySide = entity.sideField,
			entityId = entity.id;

		return {
			hasPMC: hasPMC,
			entityType: entityType,
			entityTypeName: entityTypeName,
			entityModel: entityModel,
			entityInventory: entityInventory,
			entityHash: entityHash,
			entitySide: entitySide,
			entityId: entityId
		};
	}

	function getSideName(side) { return Object.keys(config.enums.sides)[side]; }

	function retrieveModelsRecursive(modelFolders, hashesObject, attributesArr, done, loopNumber, returnObject) {
		var loopNumberActual = (loopNumber || 0),
			returnObjectActual = (returnObject || {}),
			currentModel = modelFolders[0];

		if (loopNumberActual === 0) {
			return retrieveModelsRecursive(cloneArray(modelFolders), hashesObject, attributesArr, done, (loopNumberActual + 1), returnObjectActual);
		} else {
			if (modelFolders.length > 0) {
				var thisModel = require('./../modules/index.js').getModels()[currentModel];

				thisModel.findAll({where: {'hashField': hashesObject[currentModel]}, attributes: attributesArr }).then(function(entries) {
					returnObjectActual[currentModel] = entries;
					modelFolders.splice(0, 1);

					return retrieveModelsRecursive(modelFolders, hashesObject, attributesArr, done, (loopNumberActual + 1), returnObjectActual);
				});
			} else { return done(returnObjectActual); }
		}
	}

	function validateEntriesRecursive(req, res, modelFolder, validateProperty, entries, done) {
		if (entries.length > 0) {
			var thisModel = require('./../modules/index.js').getModels()[modelFolder],
				objectQuery = {};

			objectQuery[validateProperty] = entries[0];

			thisModel.findOne({where: objectQuery}).then(function(entry) {
				if (!validate(req, res, [entry], config.messages().entry_not_found(entries[0]))) { return 0; }

				entries.splice(0, 1);
				return validateEntriesRecursive(req, res, modelFolder, validateProperty, entries, done);
			});
		} else { return done(true); }
	}

	function limitString(string, pLength, end) {
		var rString = (string || "");
		if (rString.length >= pLength) {
			rString = rString.slice(0, (pLength - rString.length)) + (end || "");
		}
		return rString;
	}

	function cloneArray(source) {
		var ret = [];
		for (var i=0; i < source.length; i++) {	ret.push(source[i]); }
		return ret;
	}

	function removeIndexFromArray(array, entriesToFilter) {
		var doneCleaning = false, cleanIndex = 0;

		for (var i=0; i < array.length; i++) {
			for (var j=0; j < entriesToFilter.length; j++) {
				if (i == entriesToFilter[j]) { array[i] = null; }
			}
		}
		while (!doneCleaning) {
			if (cleanIndex < array.length) {
				if (!(array[cleanIndex])) {
					array.splice(cleanIndex, 1);
					cleanIndex = 0;
				} else {
					cleanIndex = cleanIndex + 1;
				}
			} else { doneCleaning = true; }
		}
	}

	function validatePlayerPrivilegeFunc(req, required) {
		if (!(req.playerInfo)) { return false; } else {
			return (req.playerInfo.playerPrivilege <= required);
		}
	}

	function validatePlayerPMCTier(required) {
		return function(req, res, next) {
			if (!validate(req, res, [req.playerInfo.PMC], config.messages().modules.pmc.not_in_pmc, '', 403)) { return 0; }
			if (!validate(req, res, [req.playerInfo.playerTier <= required], config.messages().bad_permission, '', 403)) { return 0; }
			return next();
		};
	}

	function validatePlayerPMCTierFunc(req, required) {
		if (!(req.playerInfo)) { return false; } else {
			return (req.playerInfo.PMC && (req.playerInfo.playerTier <= required));
		}
	}

	function minMax(min, max, value) { return parseInt(Math.min(Math.max(parseInt(value), min), max)); }

	function minMaxArray(min, max, array) {
		var returnArray = [];

		for (var i=0; i < array.length; i++) {
			returnArray[i] = minMax(min, max, array[i]);
		}
		return returnArray;
	}

	function multiplyArray(array) {
		var sum = 1;
		for (var i = array.length - 1; i >= 0; i--) { sum *= array[i]; }
		return sum;
	}

	function dateTimeDifference(date, time) {
		// https://stackoverflow.com/a/2627493
		var _ = require("lodash"),
			timeFrame = (function(t) {
				switch(t) {
					case "day": { return [24, 60, 60, 1000]; } break;
					case "hour": { return [60, 60, 1000]; } break;
					default: { return [24, 60, 60, 1000]; }
				}
			})(time),
			oneDay = multiplyArray(timeFrame),
			currentDate = new Date();
		return (Math.round(Math.abs((date.getTime() - currentDate.getTime())/(oneDay))));
	}

	function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

	function setPseudoArray(string) {
		if (getType(string) === "array") {
			for (var i=0; i < string.length; i++) {
				if (getType(string[i]) === 'string') {
					string[i] = string[i].replace(/,/g, config.stringAlias().comma);
				}
			}
			string = string.toString();
		}
		return string;
	}

	function getPseudoArray(pString, number) {
		var string = (pString || '');
		if (string.indexOf(',') === -1) {
			string = [string];
			if (string[0] == [""]) {
				string = [];
			} else { if (number) string[0] = parseInt(string[0]); }
		} else {
			var commaReg = new RegExp(config.stringAlias().comma, "g");
			string = string.split(",");
			for (var i=0; i < string.length; i++) {
				string[i] = string[i].replace(commaReg, ',');
				if (number) string[i] = parseInt(string[i]);
			}
		}
		return string;
	}

	function setDoublePseudoArray(myArray) {
		for (var i in myArray) {
			myArray[i] = myArray[i][0] + "." + myArray[i][1];
		}
		return myArray.toString();
	}

	function getDoublePseudoArray(myArray) {
		var myString = getPseudoArray(myArray);

		for (var i in myString) {
			myString[i] = myString[i].split(".");
		}
		return myString;
	}

	function excludeArrayFromArray(target, array) {
		var _ = require('lodash');
		return _.remove(target, function (n) { return (_.indexOf(array, n) === -1); });
	}

	function sharedArrayFromArray(target, array) {
		var _ = require('lodash');
		return _.remove(target, function (n) { return (_.indexOf(array, n) > -1); });
	}

	function getType(obj) { return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase(); }

	function sendResponse(req, res, success, message, data, status, code) {
		var	response;

		if (data) { response = new config.methods.generateResponse(message, data, (success === undefined ? true : success), (code || 200)); }
		else { response = new config.methods.generateResponse(message, '', (success === undefined ? false : success), (code || 400)); }

		doLog(req, message);
		res.status(status ? status : config.enums.response_status.generic_success).json(response);
	}

	function doLog(req, text, file, folder) {
		if (process.env.ENABLE_LOGGING) {
			var fs = require('fs');

			var newDate = new Date();

			var readDate = newDate.toLocaleTimeString(),
				logIP = (req.connection.remoteAddress || "NO IP"),
				finalLog = "(" + logIP + ") " + readDate + ": " + text;

			var finalFolder = (folder || "logs");

			var finalFile = "[" + newDate.getDate() + " " + (newDate.getMonth()+1) + " " + newDate.getFullYear() + "] " + (file || 'default_log.txt');

			fs.appendFile(finalFolder + "/" + finalFile, finalLog + "\n", function (err) {
			  if (err) return console.log(err);
			  console.log("'" + text + "' has been logged into " + finalFile + ".");
			});
		}
	}

	// http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case by CMS
	function toCamelCase(str) {
		return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
			if (+match === 0) return "";
			return index === 0 ? match.toLowerCase() : match.toUpperCase();
		});
	}

	// https://stackoverflow.com/a/3710226
	function isValidJSON(v) {
		try { JSON.parse(v); } catch (e) { return false; }
		return true;
	}

	function addIfNew(value, array) {
		var newArray = array;
		if (!(findInArray(value, array)[0])) newArray.push(value);
		return newArray;
	}

	function findInArray(value, array) {
		var r = [false, 0];
		for (var i=0; i < array.length; i++) {
			if (!(r[0])) { r = (array[i] === value) ? [true, i] : r; }
		}
		return r;
	}

	function inArray(value, array) { return (array.indexOf(value) > -1); }

	function sumArray(array) {
		var n = 0;
		for (var i=0; i < array.length; i++) { n = n + parseInt(array[i]); }
		return n;
	}

	function isUndefinedOrNull(val) { return ((val === undefined ) || (val === null)); }
	function isValid(val) { return !(isUndefinedOrNull(val)); }

	function toUpperFirstChar(string) { return string.charAt(0).toUpperCase() + string.slice(1); }

	function getBoolean(value, number) {
		switch(value) {
			case "true": { return (number ? 1 : true); } break;
			case "false": { return (number ? 0 : false); } break;
			default: { return -1; } break;
		}
	}

	function boolToString(v) { if (typeof(v) == "boolean") { return v.toString(); } else { return v; } }

	function validateParameter(req, res, params, strict, middleware) {
		var rVal = [true],
			vStrict = (strict === null) ? false : strict,
			vMiddleware = (middleware === null) ? false : middleware;

		for (var i = 0, len = params.length; i < len; i++) {
			var goodCheck = true;

			if (rVal[0]) {
				// Function will take array with [[value, type(string)/length(number), type(string)/length(number)], [***]]

				var value = (getType(params[i][0]) == "array") ? params[i][0] : [params[i][0]],
					const1 = (params[i][1]),
					const2 = (params[i].length > 2) ? (params[i][2]) : null;

				for (var j = 0; j < value.length; j++) {
					if (goodCheck) {
						var curVal = value[j];

						switch (true) {
							case (isUndefinedOrNull(curVal) && !vStrict): {
								rVal = [true];
							} break;
							case (isUndefinedOrNull(curVal)): {
								goodCheck = false;
								rVal = [false, config.messages().modules.api.valueUndefined(curVal)];
							} break;
							default: {
								if (!(isNaN(curVal))) { curVal = parseInt(curVal); }

								switch(curVal) {
									case "true": { curVal = true; } break;
									case "false": { curVal = false; } break;
								}

								rVal = compareValue(const1, curVal);
								if (const2 && (rVal[0])) { rVal = compareValue(const2, curVal); }

								goodCheck = (rVal[0]);
							} break;
						}
					}
				}
			}
		}

		function compareValue(constr, value) {
			var fr = true;

			switch(getType(constr)) {
				case "string": {
					switch (constr) {
						case "email": {
							var validator = require('validator');
							fr = validator.isEmail(value) ? [true] : [false, config.messages().modules.api.invalidDataType(constr, value)];
						} break;
						default: {
							fr = (getType(value) === constr) ? [true] : [false, config.messages().modules.api.invalidDataType(constr, value)];
						} break;
					}
				} break;
				case "number": {
					switch(getType(value)) {
						case "string": {
							fr = (value.length > constr) ? [false, config.messages().modules.api.textTooBig(constr, value)] : [true];
						} break;
						case "number": {
							fr = (value > constr) ? [false, config.messages().modules.api.valueTooBig(constr, value)] : [true];
						} break;
					}
				} break;
				case "array": {
					if (getType(constr[0]) === "number") {
						switch(getType(value)) {
							case "string": {
								fr = ((value.length < constr[0]) || (value.length > constr[1])) ? [false, config.messages().modules.api.textOutLimits(constr, value)] : [true];
							} break;
							case "number": {
								if (constr.length > 2) {
									var doCheck = true;

									for (var i = 0; i < constr.length; i++) {
										if (doCheck) {
											fr = (value == constr[i]) ? [true] : [false, config.messages().modules.api.valueNotAllowed(value)];
											doCheck = (value !== constr[i]);
										}
									}
								} else {
									fr = ((value < constr[0]) || (value > constr[1])) ? [false, config.messages().modules.api.valueOutLimits(constr, value)] : [true];
								}
							} break;
						}
					} else {
						var doCheck = true;

						for (var i = 0; i < constr.length; i++) {
							if (doCheck) {
								fr = (value == constr[i]) ? [true] : [false, config.messages().modules.api.valueNotAllowed(value)];
								doCheck = (value !== constr[i]);
							}
						}
					}
				} break;
			}
			return fr;
		}

		if (!vMiddleware) {
			if (!rVal[0]) { return sendResponse(req, res, false, rVal[1]); } else {	return rVal; }
		} else {
			return (rVal[0]);
		}
	}

	function validate(req, res, params, errorMsg, code) {
		var r = true,
			pErrorMsg = (errorMsg || config.messages().invalid_params);

		for (var i = 0, len = params.length; i < len; i++) {
			if (r) {
				var type = getType(params[i]);
				switch (type) {
					case "array": {
						switch(true) {
							case ((!(params[i][0])) && (params[i].length > 0)): {
								r = false;
								pErrorMsg = params[i][1];
							} break;
							case (params[i].length === 0): { r = false; } break;
						}
					} break;
					default: { if (!(params[i])) { r = false; }	} break;
				}
			}
		}

		if (!r) { return sendResponse(req, res, false, pErrorMsg, '', code);	}

		return r;
	}

	function generateRawQuery(req, res, baseTable, selectString, extraStatement, whereHook, queryData, callback) {
		var	_ = require('lodash'),
			sequelize = config.db.connectToDatabase(),
			qSort = queryData.order[0][0],
			qOrder = queryData.order[0][1],
			mainSelect = (getType(baseTable) === "array") ? baseTable[0] : (" FROM `" + baseTable + "` ");

		baseTable = (getType(baseTable) === "array") ? baseTable[1] : baseTable;

		qSort = ((qSort === "createdAt") || (qSort === "updatedAt")) ? baseTable + "." + qSort : "`" + qSort + "`";

		var stringWhereQuery = "",
			havingStatement = "";

		for (var i=0; i < Object.keys(queryData.where).length; i++) {
			var curVal = queryData.where[Object.keys(queryData.where)[i]],
				curMainKey = Object.keys(queryData.where)[i],
				curSubKey = Object.keys(curVal)[0],
				curSubValue = (curVal)[Object.keys(curVal)[0]],
				whereAddValue = "",
				whereAnd = " ",
				doValidate = "";

			if (_.indexOf(["Pl", "Pm"], curSubValue[1]) > -1) {
				curMainKey = curSubValue[1] + "." + curMainKey;
				curSubValue = curSubValue[0];
			}

			switch(curSubKey) {
				case "$literal": { whereAddValue = curMainKey + " " + curSubValue; } break;
				case "$dliteral": { whereAddValue = curSubValue; } break;
				case "$like": {	whereAddValue = curMainKey + " LIKE '" + curSubValue + "'";	} break;
				case "$notLike": { whereAddValue = curMainKey + " NOT LIKE '" + curSubValue + "'";	} break;
				case "$gt": { doValidate = 'number'; whereAddValue = curMainKey + " > " + parseInt(curSubValue) + ""; } break;
				case "$gte": { doValidate = 'number'; whereAddValue = curMainKey + " >= " + parseInt(curSubValue) + ""; } break;
				case "$lt": { doValidate = 'number'; whereAddValue = curMainKey + " < " + parseInt(curSubValue) + ""; } break;
				case "$lte": { doValidate = 'number'; whereAddValue = curMainKey + " <= " + parseInt(curSubValue) + ""; } break;
				case "$between": { doValidate = 'number'; whereAddValue = curMainKey + " BETWEEN " + parseInt(curSubValue[0]) + " AND " + parseInt(curSubValue[1]); } break;
				case "$having": { havingStatement = " HAVING " + curSubValue; }
			}

			if (doValidate !== "") {
				if (!validateParameter(req, res, [[curSubValue, doValidate], [curSubValue[0], curSubValue[1], doValidate]])) { return 0; }
			}

			if (curSubKey !== "$having") {
				if ((Object.keys(queryData.where).length)-1 > i) { whereAnd = " AND "; }
				stringWhereQuery = stringWhereQuery + "(" + whereAddValue + ")" + whereAnd;
			}
		}

		var whereStatement = (stringWhereQuery === "") ? "WHERE " + whereHook : "WHERE (" + whereHook + " AND " + stringWhereQuery + ")";

		if ((havingStatement !== "") && (stringWhereQuery !== "")) {
			whereStatement = whereStatement.slice(0, (whereStatement.length)-5) + ")";
		}

		var finalQuery = ("SELECT SQL_CALC_FOUND_ROWS " + selectString + mainSelect + extraStatement + " " + whereStatement + havingStatement + " ORDER BY " + qSort + " " + queryData.order[0][1] + " LIMIT " + queryData.limit + " OFFSET " + queryData.offset + "");

		sequelize.query(finalQuery).spread(function (results) {
			sequelize.query("SELECT FOUND_ROWS()").spread(function (rows) {
				var rowsCount = rows[0]["FOUND_ROWS()"];
				var objectReturn = {};

				objectReturn.rows = results;
				objectReturn.count = rowsCount;

				return callback(objectReturn);
			});
		});
	}

	function arrayLike(array) {
		var r = array;
		for (var i in r) { r[i] = "%" + r[i] + "%"; }
		return r;
	}

	function generateRegexp(column, array) {
		var r = "",
			nA = [],
			_ = require('lodash');

		for (var i in array) {
			if (array[i] !== '') nA.push(_.escape(_.escapeRegExp(array[i])));
		}

		for (var i in nA) {
			r += column + " REGEXP '" + nA[i] + "' ";
			if (i < (nA.length-1)) r += "AND ";
		}
		return r;
	}

	function generatePaginatedQuery(req, res, queryValues) {

		if (!(req.serverValues)) req.serverValues = {};

		var qPage = ((req.query.page || 1)),
			orderBy = (((req.query.order || 'desc')).toUpperCase() === 'ASC') ? 'ASC' : 'DESC',
			qLimit = validatePlayerPrivilegeFunc(req, 2) ? (req.query.limit || (req.serverValues.contextLimit || config.db.queryPageLimit)) : (req.serverValues.contextLimit || config.db.queryPageLimit),
			qSort = (req.query.sort || 'createdAt');

		if (!validateParameter(req, res, [
			[[qPage, qLimit], 'number'], [[orderBy, qSort], 'string']
		])) { return 0; }

		qLimit = parseInt(qLimit);
		qPage = (parseInt(qPage) -1);

		qPage = Math.max(qPage, 0);
		qLimit = Math.max(qLimit, 0);

		if (!validateParameter(req, res, [[qSort, 'string', queryValues.allowedSortValues]])) { return 0; }
		if (!validate(req, res, [((qPage) >= 0)])) { return 0; }

		return {where: queryValues.generateWhereQuery(req), order:[[qSort, (orderBy).toUpperCase()]], offset:((qLimit)*qPage), limit:(qLimit)};
	}

})();