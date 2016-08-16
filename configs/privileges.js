(function() {
	'use strict';

	module.exports = {
		tiers: {
			owner: 0,
			admin: 1,
			moderator: 2,
			janitor: 3,
			user: 10,
			all: function() { return [this.owner, this.admin, this.moderator, this.janitor, this.user]; }
		},
		tokens: {
			admin: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZDE2MjJlMjYzMzYxODlmNTIyOWUiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNTMsImV4cCI6OTk3NDYxNjA5MjU0fQ.VgE5CU_b2uulsf4QYwOXw-H9qybHi5MWv2zhjYDpSBo",
			user: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZDRiMzY2Y2E3NWJkZjU0YjEyNGQiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNzMsImV4cCI6OTk3NDYxNjA5Mjc0fQ.eNh9GKWuzL4HiPVbcmiEwL-chzdYD1q5gdI0uw6KT-U"
		}
	}

})();