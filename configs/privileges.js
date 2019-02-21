(function() {
	'use strict';

	module.exports = {
		tiers: {
			owner: 0,
			admin: 1,
			moderator: 2,
			janitor: 3,
			user: 4,
			all: function() { return [this.owner, this.admin, this.moderator, this.janitor, this.user]; }
		}
	};

})();