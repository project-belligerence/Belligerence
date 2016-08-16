
// SERVER CONFIGS

var getConfig = function(config) {
	var reload = require('require-reload')(require),
		path = require('path'),
		fPath = './configs/' + config + '.js';

	delete require.cache[path.resolve(fPath)];
	return reload(fPath);
};

module.exports = {
	env: 'development',
	port: (process.env.PORT || 8080),

	folders: getConfig('folders'),
	db: getConfig('db'),

	privileges: function() { return getConfig('privileges'); },
	numbers: getConfig('numbers'),
	enums: getConfig('enums'),
	messages: function() { return getConfig('messages'); },
	methods: getConfig('methods'),
	stringAlias: function() { return getConfig('string_alias'); },

	specialStrings: {
		abbreviator: '[...]'
	},

	names: {
		credits: {
			name: 'Deckels',
			sign: 'D$'
		}
	},

	properties: {
		actionCost: {
			invites: "costInvites",
			postIntel: "costPostIntel",
			buyPrestige: "costBuyPrestige",
			upgradeSize: "costUpgradeSize"
		}
	}
};