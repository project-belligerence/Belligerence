(function() {
	/* jshint shadow:true */

	'use strict';

	var Methods = require('./../modules/index.js').getMethods(),
		Models = require('./../modules/index.js').getModels(),
		Players = Methods.players,
		PlayerSettings = Methods.player_settings,
		PMC = Methods.pmc,
		Upgrades = Methods.upgrades,
		Messages = Methods.messages,
		Stores = Methods.stores,
		StoresLines = Methods.store_lines,
		Items = Methods.items,
		Invites = Methods.invites,
		Modifiers = Methods.modifiers,
		Transactions = Methods.transactions,
		TransactionHistory = Methods.transaction_history,
		Intel = Methods.intel,
		ActionsCost = Methods.actions_cost,
		Cheers = Methods.cheers,
		Upload = Methods.upload,
		Friends = Methods.friends,
		GeneralMethods = Methods.general_methods,
		CommentsMethods = Methods.comments,
		Reports = Methods.reports,
		Bans = Methods.bans,

		bodyParser = require('body-parser'),
		config = require('./../config.js'),
		API = require('./api.js');

	exports.setup = setup;

	function renderIndex(req, res) { res.render(config.folders.static + '/' + 'index'); }
	function renderStatic(req, res) { res.render(config.folders.static + req.params.static); }
	function renderPartial(req, res) { res.render(config.folders.partials + '/' + req.params.partial); }
	function renderDashboard(req, res) { res.render(config.folders.partials + '/dashboard/' + req.params.partial); }
	function renderDirective(req, res) { res.render(config.folders.directives + '/' + req.params.directive); }
	function renderModal(req, res) { res.render(config.folders.partials + '/' + 'modals/' + req.params.modal); }

	function setup(app, express) {

		var
			indexRouter = express.Router(),
			testingRouter = express.Router(),
			playersRouter = express.Router(),
			PMCRouter = express.Router(),
			UpgradesRouter = express.Router(),
			MessagesRouter = express.Router(),
			StoresRouter = express.Router(),
			ItemsRouter = express.Router(),
			InvitesRouter = express.Router(),
			ModifiersRouter = express.Router(),
			PlayerActionsRouter = express.Router(),
			PMCActionsRouter = express.Router(),
			AdminRouter = express.Router(),
			GeneralActionsRouter = express.Router();

		indexRouter
			.get('/', function(req, res) { res.sendStatus(200); })
		;

		testingRouter
			.post('/minMaxTest', function(req, res) {
				res.json(API.methods.minMax(req.body.min, req.body.max, req.body.value));
			})
			.post('/getMachineName', function(req, res) {
				var os = require("os");
				API.methods.sendResponse(req, res, true, os.hostname());
			})
			.post('/pseudoArray', function(req, res) {
				API.methods.sendResponse(req, res, true, "", API.methods.getPseudoArray(req.body.string));
			})
			.post('/pseudoDoubleArray', function(req, res) {
				var myArray = API.methods.setDoublePseudoArray(req.body.array),
					myString = API.methods.getDoublePseudoArray(myArray);

				API.methods.sendResponse(req, res, true, "", {resultFromString: myString, resultFromArray: myArray});
			})
			.post('/validateParameter', function(req, res) {
				if (!API.methods.validate(req, res, [req.body.text])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[[req.body.text], 'string', 5], [req.body.number, 'number', 10]])) { return 0; }

				API.methods.sendResponse(req, res, true, API.methods.getType(true), "All valid!");
			})
			.use(API.methods.authenticateToken)
			.post('/getPlayerTransactions', function(req, res) {
				Models.players.findOne({ where: {"hashField":req.playerInfo.hashField}}).then(function(entry) {
					entry.getAllTransactions(function(transactions){
						API.methods.sendResponse(req, res, true, "", transactions);
					});
				});
			})
			.post('/getPMCTransactions', function(req, res) {
				Models.pmc.findOne({ where: {"hashField":"bbfd80270144ea8e58ec"}}).then(function(entry) {
					entry.getAllTransactions(function(transactions){
						API.methods.sendResponse(req, res, true, "", transactions);
					});
				});
			})
			.post('/getPMCItems', function(req, res) {
				Models.pmc.findOne({ where: {"hashField":"bbfd80270144ea8e58ec"}}).then(function(entry) {
					entry.getItems(function(items) {
						API.methods.sendResponse(req, res, true, "", items);
					});
				});
			})
			.post('/updateItemsValue', Items.updateItemsValue)
		;

		// playersRouter //
		// 	.get('/:Hash', Players.getPlayer)
		// 	.post('/auth', Players.authPlayer)
		// 	.post('/', Players.newPlayer)
		// 	.use(API.methods.authenticateToken)
		// 	.get('/', Players.getAll)
		// 	.get('/get/self', Players.getSelf)
		// 	.put('/:Hash', Players.putPlayer)
		// 	.post('/set/pmc', Players.setPMC);

		// PMCRouter //
		// 	.get('/:Hash', PMC.getPMC)
		// 	.use(API.methods.authenticateToken)
		// 	.get('/', PMC.getAllPMC)
		// 	.post('/', PMC.newPMC)
		// 	.put('/:Hash', PMC.putPMC);

		ItemsRouter //
			.get('/:Hash', Items.get)
			.use(API.methods.authenticateToken)
			.get('/', Items.getAll)
			.post('/', Items.post)
			.put('/:Hash', Items.put)
			.get('/player/:Hash', Items.getPlayer)
			.get('/pmc/:Hash', Items.getPMC)
			.put('/set/pmc', Items.putPMC);

		UpgradesRouter //
			.get('/:Hash', Upgrades.get)
			.use(API.methods.authenticateToken)
			.get('/', Upgrades.getAll)
			.put('/:Hash', Upgrades.put)
			.put('/set/pmc', Upgrades.putPMC)
			.put('/set/player', Upgrades.putPlayer)
			.post('/pmc', Upgrades.postPMC)
			.post('/player', Upgrades.postPlayer)
			.post('/', Upgrades.post);

		MessagesRouter //
			.use(API.methods.authenticateToken)
			.get('/', Messages.getAll)
			.get('/sent', Messages.getSent)
			.get('/received', Messages.getReceived)
			.get('/:Hash', Messages.get)
			.put('/:Hash', Messages.put)
			.post('/', Messages.post);

		InvitesRouter
			.use(API.methods.authenticateToken)
			.get('/', Invites.getAll)
			.get('/:Hash', Invites.get)
			.get('/sent/player', Invites.getSentPlayer)
			.get('/received/player', Invites.getReceivedPlayer)
			.get('/sent/pmc', Invites.getSentPMC)
			.get('/received/pmc', Invites.getReceivedPMC)
			.post('/', Invites.post)
			.post('/resolve/:Hash', Invites.resolve);

		ModifiersRouter
			.get('/:Name', Modifiers.get)
			.use(API.methods.authenticateToken)
			.get('/', Modifiers.getAll)
			.post('/', Modifiers.post)
			.put('/:Name', Modifiers.put)
			.post('/setActive', Modifiers.setActive);

		StoresRouter
			.get('/:Hash', Stores.get)
			.get('/getStoreStock/:Hash', Stores.getStoreStock)
			.get('/getRandomStoreLine/:Hash', StoresLines.getRandomStoreLine)
			.use(API.methods.authenticateToken)
			.get('/', Stores.getAll)
			.post('/', Stores.post)
			.put('/:Hash', Stores.put)
			.get('/getStoreLines/:Hash', StoresLines.getStoreLines)
			.post('/addStoreStock/:Hash', Stores.addStoreStock)
			.put('/updateStoreStock/:Hash', Stores.updateStoreStock)
			.post('/addStoreLine/:Hash', StoresLines.post)
			.put('/updateStoreLine/:Hash', StoresLines.put);

		PlayerActionsRouter // For actions that are specifically related to the player.

			.post('/auth', Players.authPlayer)

			.use(API.methods.authenticateToken)
			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.user))
			.use(API.methods.getBannedStatus)

				/* Uploading */
				.post('/uploadPlayerAvatar', Upload.uploadPlayerAvatar)

				/* Personal */
				.get('/getSelf', Players.getSelf)
				.put('/updateSelf', Players.putPlayerSelf)
				.get('/getFriendsSelf', Friends.getFriendsPlayerRead)
				.post('/removeFriend', Friends.removeFriend)

				.get('/getSettingsSelf', PlayerSettings.getSettingSelf)
				.put('/updateSettingsSelf', PlayerSettings.updateSettingSelf)
				.post('/addAllowedMachine', PlayerSettings.addAllowedMachine)
				.post('/removeAllowedMachine', PlayerSettings.removeAllowedMachine)

				/* Contract */
				.post('/playerGoFreelancerSelf', Players.playerSelfGoFreelancer)
				.post('/playerGoSoldierSelf', Players.playerSelfGoSoldier)

				/* PMC */
				.post('/startPMC', PMC.startPMC)

				/* Messages */
				.get('/getSentMessagesSelf', Messages.getSent)
				.get('/getReceivedMessagesSelf', Messages.getReceived)

				/* Invites */
				.get('/getReceivedInvitesSelf', Invites.getReceivedPlayer)
				.get('/getSentInvitesSelf', Invites.getSentPlayer)
		;

		PMCActionsRouter // For actions only players in a PMC can perform.
			.use(API.methods.authenticateToken)
			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.user))

				.post('/leaveSelfPMC', Players.playerSelfLeavePMC)

			.use(API.methods.getBannedStatus)

				/* Personal */
				.get('/getSelf', PMC.getSelf)
				.get('/getSelfPMCPlayers', PMC.getSelfPMCPlayers)
				.get('/getFriendsSelf', Friends.getFriendsPMCRead)

			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.janitor))



			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.moderator))

				/* Invites */
				.get('/getReceivedInvitesPMC', Invites.getReceivedPMC)
				.get('/getSentInvitesPMC', Invites.getSentPMC)

			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.admin))

				.put('/editSelfPMC', PMC.putSelfPMC)
				.post('/proDemoteMember', PMC.proDemoteMember)
				.post('/kickMember', PMC.kickMember)
				.post('/upgradePMCSize', PMC.upgradePMCSize)

				/* Uploads */
				.post('/uploadPMCAvatar', Upload.uploadPMCAvatar)

			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.owner))

				.post('/transferPMCOwnership', PMC.transferPMCOwnership)
		;

		GeneralActionsRouter // Actions that can be performed regardless of your context.

			.use(API.methods.checkToken)

				/* Items */
				.get('/getItems', Items.getAllLimited)
				.get('/getItem/:Hash', Items.get)

				/* Upgrades */
				.get('/getUpgrades', Upgrades.getAll)
				.get('/getUpgrade/:Hash', Upgrades.get)

				.get('/getUpgradesPlayer/:Hash', Upgrades.getUpgradesPlayer)
				.get('/getUpgradesPMC/:Hash', Upgrades.getUpgradesPMC)

				/* Economy */
				.get('/getStores', Stores.getAll)
				.get('/getStore/:Hash', Stores.get)
				.get('/getStoreStock/:Hash', Stores.getStoreStock)
				.get('/getStoreLines/:Hash', StoresLines.getStoreLines)
				.get('/getRandomStoreLine/:Hash', StoresLines.getRandomStoreLine)

				/* Intel */
				.get('/getIntel/:Hash', Intel.get)
				.get('/getIntel', Intel.getAll)

				/* Actions Cost */
				.get('/getCostTableProperty/:Data', ActionsCost.getProperty)
				.get('/getCostTableActive', ActionsCost.getActive)

				/* Players */
				.get('/getPlayers', Players.getAll)
				.get('/getAllUnemployed', Players.getAllUnemployed)
				.get('/getPlayer/:Hash', Players.getPlayer)
				.post('/newPlayer', Players.newPlayer)

				/* PMC */
				.get('/getPMC/:Hash', PMC.getPMC)
				.get('/getAllPMC', PMC.getAllPMC)
				.get('/getPMCPlayers/:Hash', PMC.getPMCPlayers)

				/* Comments */
				.get('/getComments/:type/:subject', CommentsMethods.getComments)

			.use(API.methods.authenticateToken)
			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.user))
			.use(API.methods.getBannedStatus)

				/* Reports */
				.post('/postReport', Reports.postReport)

				/* Cheers */
				.post('/cheerContent', Cheers.post)
				.post('/unCheerContent', Cheers.deleteEntry)

				/* Messages */
				.post('/sendMessage', Messages.post)
				.get('/countMessagesInvitesReceived', GeneralMethods.countMessagesInvitesReceived)

				/* Items */
				.post('/buyItem', GeneralMethods.buyItem)
				.get('/getInventorySelf', Items.getInventorySelf)

				/* Upgrades */
				.get('/getUpgradesSelf', Upgrades.getUpgradesSelf)
				.post('/toggleUpgradeVisibility', GeneralMethods.toggleUpgradeVisibility)
				.post('/toggleUpgradeProminence', GeneralMethods.toggleUpgradeProminence)
				.post('/setUpgradeVisibilityAll', GeneralMethods.setUpgradeVisibilityAll)
				.post('/buyUpgrade', GeneralMethods.buyUpgrade)

				/* Intel */
				.post('/postIntel', Intel.post)
				.delete('/removeIntel/:Hash', Intel.deleteEntry)

				/* Invites */
				.post('/sendInvite', Invites.post)
				.post('/resolveInvite/:Hash', Invites.resolve)
				.post('/deleteInvite/:Hash', Invites.deleteEntry)

				/* Friends */
				.get('/getFriendsAllSelf', Friends.getFriendsAllRead)

				/* Economy */
				.get('/getTransactionsSelf', TransactionHistory.getTransactionsSelf)
				.get('/getTransaction/:Hash', TransactionHistory.get)

				/* Comments */
				.post('/postComment', CommentsMethods.postComment)
				.post('/deleteComment', CommentsMethods.deleteComment)
		;

		AdminRouter // Actions that only those with certain privileges can perform.
			.use(API.methods.authenticateToken)
			.use(API.methods.getBannedStatus)
			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.janitor))

			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.moderator))

				/* Items */
				.get('/getItems', Items.getAll)
				.post('/addItem', Items.post)
				.post('/duplicateItem/:Hash', Items.duplicateItem)
				.put('/editItem/:Hash', Items.put)

				/* Bans */
				.post('/banPlayer', Bans.post)
				.put('/editBan/:Hash', Bans.put)

				/* Upgrades */
				.post('/addUpgrade', Upgrades.post)
				.post('/duplicateUpgrade', Upgrades.duplicateUpgrade)
				.put('/editUpgrade/:Hash', Upgrades.put)

				/* Invites */
				.get('/getInvite/:Hash', Invites.get)
				.get('/getInvites', Invites.getAll)

				/* Modifiers */
				.get('/getModifiers', Modifiers.getAll)
				.get('/getModifier/:Name', Modifiers.get)
				.post('/addModifier', Modifiers.post)
				.put('/editModifier/:Name', Modifiers.put)
				.post('/setModifierActive', Modifiers.setActive)

				/* Actions Cost */
				.get('/getCostTables', ActionsCost.getAll)
				.get('/getCostTables/:Name', ActionsCost.get)
				.post('/addCostTable', ActionsCost.post)
				.put('/editCostTable/:Name', ActionsCost.put)
				.post('/setCostTableActive', ActionsCost.setActive)

				/* Stores */
				.post('/addStore', Stores.post)
				.get('/getStores', Stores.getAll)
				.put('/editStore/:Hash', Stores.put)
				.post('/addStoreStock/:Hash', Stores.addStoreStock)
				.put('/updateStoreStock/:Hash', Stores.updateStoreStock)

				/* Store Lines */
				.get('/getStoreLines', StoresLines.getAll)
				.post('/addStoreLine/:Hash', StoresLines.post)
				.put('/updateStoreLine/:Hash', StoresLines.put)

				/* Reports */
				.get('/getReports/', Reports.getAll)
				.post('/toggleResolved/:Hash', Reports.toggleResolved)

				/* Uploads */
				.post('/uploadModulePicture/:Type/:Hash', Upload.uploadModulePicture)

			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.admin))

				/* Items */
				.get('/getPlayerInventory/:Hash', Items.getInventoryPlayer)
				.get('/getPMCInventory/:Hash', Items.getInventoryPMC)

				/* Upgrades */
				.post('/addUpgradePMC', Upgrades.postPMC)
				.post('/addUpgradePlayer', Upgrades.postPlayer)
				.put('/editUpgradePMC', Upgrades.putPMC)
				.put('/editUpgradePlayer', Upgrades.putPlayer)

				/* Invites */

				/* Messages */
				.get('/getAllMessages/', Messages.getAll)

				/* Transactions */
				.get('/getAllTransactions', TransactionHistory.getAll)

				/* Players */
				.put('/editPlayer/:Hash', Players.putPlayer)
				.post('/forcePlayerJoinPMC/:Hash', Players.playerJoinPMC)
				.post('/forcePlayerGoFreelancer/:Hash', Players.playerGoFreelancer)

				/* PMC */
				.put('/editPMC/:Hash', PMC.putPMC)

			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.owner))
		;

		// DEFAULT ROUTES
		app.get('/', renderIndex);
		app.get('/partial/:partial', renderPartial);
		app.get('/dashboard/:partial', renderDashboard);
		app.get('/directive/:directive', renderDirective);
		app.get('/modals/:modal', renderModal);

		// MOUNT API ROUTES
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(bodyParser.json({limit: '1mb'}));

		app.use('/', indexRouter);
		app.use('/testRoute', testingRouter);
		app.use('/api/players', playersRouter);
		app.use('/api/pmc', PMCRouter);
		app.use('/api/upgrades', UpgradesRouter);
		app.use('/api/messages', MessagesRouter);
		app.use('/api/items', ItemsRouter);
		app.use('/api/invites', InvitesRouter);
		app.use('/api/modifiers', ModifiersRouter);
		app.use('/api/stores', StoresRouter);
		app.use('/api/playeractions', PlayerActionsRouter);
		app.use('/api/pmcactions', PMCActionsRouter);
		app.use('/api/generalactions', GeneralActionsRouter);
		app.use('/api/adminactions', AdminRouter);

		app.get('*', renderIndex);
	}

})();