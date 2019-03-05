(function() {
	/* jshint shadow:true */

	'use strict';

	var Methods = require('./../modules/index.js').getMethods(),
		Models = require('./../modules/index.js').getModels(),
		AWSMethods = Methods.aws,
		Players = Methods.players,
		PlayerSettings = Methods.player_settings,
		PMC = Methods.pmc,
		Upgrades = Methods.upgrades,
		Messages = Methods.messages,
		Maps = Methods.maps,
		Factions = Methods.factions,
		Advisories = Methods.advisories,
		Objectives = Methods.objectives,
		Conflicts = Methods.conflicts,
		Contracts = Methods.contracts,
		Negotiations = Methods.negotiations,
		Locations = Methods.locations,
		Stores = Methods.stores,
		StoresLines = Methods.store_lines,
		Items = Methods.items,
		Invites = Methods.invites,
		Modifiers = Methods.modifiers,
		Transactions = Methods.transactions,
		TransactionHistory = Methods.transaction_history,
		Intel = Methods.intel,
		Interest = Methods.interest,
		ActionsCost = Methods.actions_cost,
		Cheers = Methods.cheers,
		Upload = Methods.upload,
		Friends = Methods.friends,
		GeneralMethods = Methods.general_methods,
		CommentsMethods = Methods.comments,
		Reports = Methods.reports,
		Bans = Methods.bans,
		Loadouts = Methods.loadouts,
		Missions = Methods.missions,
		AccessKeys = Methods.access_keys,

		SimpleAirdrops = Methods.simple_airdrop,
		SimpleMissions = Methods.simple_mission,

		passport = require('passport'),
		bodyParser = require('body-parser'),
		config = require('./../config.js'),
		API = require('./api.js');

	exports.setup = setup;

	function renderIndex(req, res) { res.render(config.folders.static + '/' + 'index'); }
	function renderStatic(req, res) { res.render(config.folders.static + req.params.static); }
	function renderPartial(req, res) { res.render(config.folders.partials + '/' + req.params.partial); }
	function renderDashboard(req, res) { res.render(config.folders.partials + '/dashboard/' + req.params.partial); }
	function renderAdmin(req, res) { res.render(config.folders.partials + '/admin/' + req.params.partial); }
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
			GeneralActionsRouter = express.Router(),
			S3ActionsRouter = express.Router();

		indexRouter.get('/', function(req, res) { res.sendStatus(200); });

		testingRouter
			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.owner))

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

			.get('/steamStuff', function(req, res) {
				API.methods.sendResponse(req, res, true, "req.user", req.user);
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

		S3ActionsRouter
				.get('/:FilePath*', AWSMethods.getS3File)
		;

		PlayerActionsRouter // For actions that are specifically related to the player.

				.post('/auth', Players.authPlayer)
				.post('/findPlayerByProperty', Players.findPlayerByProperty)

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
				.post('/confirmPassword', Players.confirmPassword)

				.get('/getMachineName', PlayerSettings.getMachineName)
				.get('/getSettingsSelf', PlayerSettings.getSettingSelf)
				.put('/updateSettingsSelf', PlayerSettings.updateSettingSelf)
				.post('/addAllowedMachine', PlayerSettings.addAllowedMachine)
				.post('/removeAllowedMachine', PlayerSettings.removeAllowedMachine)

				.get('/getAllOperationsSelf', GeneralMethods.getAllOperationsSelf)

				.post('/claimNetworth', Players.claimNetworth)

				/* Job Status */
				.post('/playerGoFreelancerSelf', Players.playerSelfGoFreelancer)
				.post('/playerGoSoldierSelf', Players.playerSelfGoSoldier)

				/* PMC */
				.post('/startPMC', PMC.startPMC)

				/* Messages */
				.get('/getSentMessagesSelf', Messages.getSent)
				.get('/getReceivedMessagesSelf', Messages.getReceived)

				/* Intel */
				.post('/uploadIntelPicture/:intelHash', Upload.uploadIntelPicture)

				/* Invites */
				.get('/getReceivedInvitesSelf', Invites.getReceivedPlayer)
				.get('/getSentInvitesSelf', Invites.getSentPlayer)

				/* Contracts */
				.get('/getSignedContractsSelf', Contracts.getSignedContracts)
				.get('/getLastSignedContractSelf', Contracts.getLastSignedContract)
				.delete('/removeContract/:Hash', Contracts.deleteEntry)
				.get('/getContractedPercentage', Contracts.getContractedPercentage)
				.post('/redeemContract/:Hash', Contracts.redeemContract)

				/* Negotiations */
				.get('/getNegotiationsSelf', Negotiations.getNegotiationsSelf)
				.get('/getNegotiation', Negotiations.getNegotiation)
				.post('/acceptContract/:Hash', Negotiations.acceptContract)
				.delete('/cancelNegotiation/:Hash', Negotiations.deleteEntry)

				/* Interest */
				.get('/getMarkedInterestsSelf', Interest.getMarkedInterests)
				.post('/addInterestToMission', Interest.post)
				.delete('/removeInterest/:Hash', Interest.deleteEntry)
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
				.get('/getPMCSizeCost', PMC.getPMCSizeCost)

			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.janitor))

			.use(API.methods.validatePlayerPMCTier(config.privileges().tiers.moderator))

				/* Invites */
				.get('/getReceivedInvitesPMC', Invites.getReceivedPMC)
				.get('/getSentInvitesPMC', Invites.getSentPMC)

				/* Alliances */
				.post('/removeAlliance', Friends.removeAlliance)

				/* Contracts */
				.post('/signContract', Contracts.post)
				.delete('/deleteContract/:Hash', Contracts.deleteEntry)

				/* Negotiations */
				.post('/startNegotiation', Negotiations.post)

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

				.post('/checkKeyValidity/', AccessKeys.checkKeyValidity)

			.use(API.methods.checkToken)

				/* Items */
				.get('/getItems', Items.getAllLimited)
				.get('/getItemsTypeahead', Items.getAllTypeHead)
				.get('/getItem/:Hash', Items.get)
				.get('/getItemsTypeClass', Items.getItemsTypeClass)
				.get('/getItemContent', Items.getItemContent)

				/* Maps */
				.get('/getMaps', Maps.getLimited)
				.get('/getMap/:Hash', Maps.get)
				.get('/getClimates', Maps.getClimates)
				.get('/getMapList', Maps.getMapList)

				/* Factions */
				.get('/getFactions', Factions.getLimited)
				.get('/getFaction/:Hash', Factions.get)
				.get('/getPolicies', Factions.getPolicies)
				.get('/getDoctrines', Factions.getDoctrines)

				/* Conflicts */
				.get('/getConflicts', Conflicts.getLimited)
				.get('/getActiveConflicts', Conflicts.getActiveConflicts)
				.get('/getActiveFactionConflicts', Conflicts.getActiveFactionConflicts)
				.get('/getConflict/:Hash', Conflicts.get)
				.get('/getBelligerents/:Hash', Conflicts.getBelligerents)
				.get('/getConflictStatus', Conflicts.getConflictStatus)

				/* Advisories */
				.get('/getAdvisories', Advisories.getLimited)
				.post('/getAdvisoriesSimple', Advisories.getSimpleList)
				.get('/getAdvisory/:Hash', Advisories.get)

				/* Objectives */
				.get('/getObjectives', Objectives.getLimited)
				.post('/getObjectivesSimple', Objectives.getSimpleList)
				.get('/getObjective/:Hash', Objectives.get)
				.get('/getObjectivesList', Objectives.getObjectiveList)

				/* Missions */
				.get('/getMissions', Missions.getLimited)
				.get('/getMission/:Hash', Missions.get)
				.get('/getMissionParticipants/:Hash', Missions.getMissionParticipants)
				.get('/getSignatureFee', Missions.getSignatureFee)
				.get('/getInterestedPlayers/:Hash', Interest.getInterestedPlayers)

				/* Contracts */
				.get('/getMissionContracts/:Hash', Contracts.getMissionContracts)

				/* Locations */
				.get('/getLocations', Locations.getLimited)
				.get('/getLocation/:Hash', Locations.get)
				.get('/getLocationTypes', Locations.getLocationTypes)

				/* Upgrades */
				.get('/getUpgrades', Upgrades.getAll)
				.get('/getUpgrade/:Hash', Upgrades.get)
				.get('/getUpgradesSimple', Upgrades.getAllSimple)
				.get('/getUpgradeTree', Upgrades.getUpgradeTree)

				.get('/getUpgradesPlayer/:Hash', Upgrades.getUpgradesPlayer)
				.get('/getUpgradesPMC/:Hash', Upgrades.getUpgradesPMC)
				.get('/getUpgradesData', Upgrades.getUpgradesData)

				/* Economy */
				.get('/getStores', Stores.getAll)
				.get('/getStore/:Hash', Stores.get)
				.get('/getStoreStock/:Hash', Stores.getStoreStock)
				.get('/getStoreFromItem/:Hash', Stores.getStoreFromItem)
				.post('/getStoresAndItems', Stores.getStoresAndItems)
				.get('/getStoreLines/:Hash', StoresLines.getStoreLines)
				.get('/getRandomStoreLine/:Hash', StoresLines.getRandomStoreLine)

				/* Stores */
				.get('/getStoreSpecializations', Stores.getStoreSpecializations)
				.get('/getStoreStatuses', Stores.getStoreStatuses)

				/* Intel */
				.get('/getIntel/:Hash', Intel.get)
				.get('/getIntel', Intel.getAll)
				.post('/getIntelPrice', Intel.returnIntelPrice)
				.post('/getIntelPricePartial', Intel.returnIntelPricePartial)

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
				.get('/getPMCTiers/:Hash', PMC.getPMCTiers)

				/* All */
				.post('/resetSideAlignment', GeneralMethods.resetSideAlignment)
				.get('/getSideAlignment', GeneralMethods.getSideAlignment)

				/* Comments */
				.get('/getComments/:type/:subject', CommentsMethods.getComments)

				/* Steam Session */
				.get('/getSteamSession', GeneralMethods.getSteamSession)
				.post('/getSteamValid', GeneralMethods.getSteamValid)
				.post('/destroySteamSession', GeneralMethods.destroySteamSession)

				/* General */
				.get('/getSides', GeneralMethods.getSides)
				.get('/getRegions', GeneralMethods.getRegions)
				.get('/getNpmPackages', API.methods.returnNpmDependencies)

			.use(API.methods.authenticateToken)
			.use(API.methods.validatePlayerPrivilege(config.privileges().tiers.user))
			.use(API.methods.getBannedStatus)

				/* Access Key */
				.post('/redeemAccessKey', AccessKeys.redeemAccessKey)

				/* Rank */
				.post('/upgradePrestigeRank', GeneralMethods.upgradePrestigeRank)
				.get('/getPrestigeRankCost', GeneralMethods.getPrestigeRankCost)

				/* Reports */
				.post('/postReport', Reports.postReport)

				/* Cheers */
				.post('/cheerContent', Cheers.post)
				.post('/unCheerContent', Cheers.deleteEntry)

				/* Messages */
				.post('/sendMessage', Messages.post)
				.get('/countMessagesInvitesReceived', GeneralMethods.countMessagesInvitesReceived)
				.get('/countActiveOperations', GeneralMethods.countActiveOperations)

				/* Items */
				.post('/buyItem', GeneralMethods.buyItem)
				.get('/getInventorySelf', Items.getInventorySelf)
				.post('/deployItem/:Hash', Items.deployItem)

				/* Upgrades */
				.get('/getUpgradesSelf', Upgrades.getUpgradesSelf)
				.get('/getProminentUpgradesSelf', Upgrades.getProminentUpgradesSelf)
				.post('/reSpecTree/:Hash', Upgrades.reSpecTree)
				.get('/checkUpgradeOwned/:Hash/:Rank', Upgrades.checkUpgradeOwned)
				.post('/toggleUpgradeProminence', GeneralMethods.toggleUpgradeProminence)
				.post('/setUpgradesInvisibleAll', GeneralMethods.setUpgradeVisibilityAll)
				.post('/buyUpgrade', GeneralMethods.buyUpgrade)

				/* Intel */
				.post('/postIntel', Intel.post)
				.put('/editIntel/:Hash', Intel.put)
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
				.get('/getCurrentFundsSelf', GeneralMethods.getCurrentFundsSelf)

				/* Comments */
				.post('/postComment', CommentsMethods.postComment)
				.post('/deleteComment', CommentsMethods.deleteComment)

				/* Message */
				.get('/readMessage/:Hash', Messages.get)
				.delete("/deleteMessage/:Hash", Messages.deleteMessage)

				/* Negotiations */
				.post('/counterNegotiation/:Hash', Negotiations.counterOffer)

				/* Loadouts */
				.get('/getSelfLoadouts', Loadouts.getSelfLoadouts)
				.post('/addLoadout', Loadouts.post)
				.put('/editLoadout/:Hash', Loadouts.put)
				.delete('/deleteLoadout/:Hash', Loadouts.deleteLoadout)
				.post('/deployLoadout/:Hash', Loadouts.deployLoadout)
				.post('/toggleLoadoutBookmark/:Hash', Loadouts.toggleLoadoutBookmark)
				.post('/resetDeployedItems', Items.resetDeployedItems)

				// ========= PRESENTATION STUFF ============================

				/* Airdrops */
				.post("/sendObjectAirdrop", SimpleAirdrops.post)

				/* Missions */
				.get("/getSimpleMissions", SimpleMissions.getAll)
				.post("/postSimpleMission", SimpleMissions.post)
				.put("/updateSimpleMission/:Hash", SimpleMissions.updateMissionStatus)
				.post("/signContractSimpleMission/:Hash", SimpleMissions.signContract)
				.post("/claimRewardSimpleMission/:Hash", SimpleMissions.claimReward)
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
				.delete('/deleteEntry/:Hash', Items.deleteEntry)

				/* Maps */
				.post('/addMap', Maps.post)
				.put('/editMap/:Hash', Maps.put)
				.delete('/deleteMap/:Hash', Maps.deleteEntry)

				/* Locations */
				.post('/addLocation', Locations.post)
				.put('/editLocation/:Hash', Locations.put)
				.delete('/deleteLocation/:Hash', Locations.deleteEntry)

				/* Advisories */
				.post('/addAdvisory', Advisories.post)
				.post('/duplicateAdvisory/:Hash', Advisories.duplicateEntry)
				.put('/editAdvisory/:Hash', Advisories.put)
				.delete('/deleteAdvisory/:Hash', Advisories.deleteEntry)

				/* Objectives */
				.post('/addObjective', Objectives.post)
				.post('/duplicateObjective/:Hash', Objectives.duplicateEntry)
				.put('/editObjective/:Hash', Objectives.put)
				.delete('/deleteObjective/:Hash', Objectives.deleteEntry)

				/* Factions */
				.post('/addFaction', Factions.post)
				.post('/duplicateFaction/:Hash', Factions.duplicateEntry)
				.put('/editFaction/:Hash', Factions.put)
				.delete('/deleteFaction/:Hash', Factions.deleteEntry)

				/* Missions */
				.post('/addMission', Missions.post)
				.put('/editMission/:Hash', Missions.put)
				.delete('/deleteMission/:Hash', Missions.deleteEntry)
				.post('/cleanUpMissions', Missions.cleanUpMissions)

				/* Conflicts */
				.post('/addConflict', Conflicts.post)
				.post('/addBelligerent/:Hash', Conflicts.addBelligerent)
				.post('/removeBelligerent/:Hash', Conflicts.removeBelligerent)
				.put('/editBelligerent/:Hash', Conflicts.editBelligerent)
				.put('/editConflict/:Hash', Conflicts.put)
				.delete('/deleteConflict/:Hash', Conflicts.deleteEntry)

				/* Bans */
				.get('/getBans', Bans.getAll)
				.post('/banPlayer', Bans.post)
				.put('/editBan/:Hash', Bans.put)
				.delete('/liftBan/:Hash', Bans.deleteBan)

				/* Upgrades */
				.post('/addUpgrade', Upgrades.post)
				.post('/duplicateUpgrade', Upgrades.duplicateUpgrade)
				.put('/editUpgrade/:Hash', Upgrades.put)
				.delete('/deleteUpgrade/:Hash', Upgrades.deleteUpgrade)

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
				.get('/getStoreStockAdmin/:Hash', Stores.getStoreStockAdmin)
				.put('/editStore/:Hash', Stores.put)
				.delete('/deleteStore/:Hash', Stores.deleteStore)
				.post('/addStoreStock/:Hash', Stores.addStoreStock)
				.post('/removeStoreStock/:Hash', Stores.removeStoreStock)
				.put('/updateStoreStock/:Hash', Stores.updateStoreStock)
				.put('/updateStoreStockRecursive/:Hash', Stores.updateStoreStockRecursiveRoute)
				.post('/resupplyStoreStock/:Hash', Stores.resupplyStore)

				/* Store Lines */
				.get('/getStoreLines', StoresLines.getAll)
				.post('/addStoreLine/:Hash', StoresLines.post)
				.put('/updateStoreLine/:Hash', StoresLines.put)

				/* Reports */
				.get('/getReports/', Reports.getAll)
				.post('/toggleResolved/:Hash', Reports.toggleResolved)
				.delete('/deleteReport/:Hash', Reports.deleteReport)

				/* Uploads */
				.post('/uploadModulePicture/:Type/:Hash', Upload.uploadModulePicture)
				.get('/getImagesInFolder', Upload.getImagesInFolder)
				.post('/deleteImageinFolder', Upload.deleteImageinFolder)

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

				.get('/getAccessKeys/', AccessKeys.getAll)
				.post('/generateAccessKey/', AccessKeys.post)
				.delete('/deleteAccessKey/:Seed', AccessKeys.deleteKey)
		;

		// DEFAULT ROUTES
		app.get('/', renderIndex);
		app.get('/partial/:partial', renderPartial);
		app.get('/dashboard/:partial', renderDashboard);
		app.get('/admin-tools/:partial', renderAdmin);
		app.get('/directive/:directive', renderDirective);
		app.get('/modals/:modal', renderModal);

		// MOUNT STEAM PASSPORT ROUTES
		app.get('/auth/steam', passport.authenticate('steam'), function(req, res) {});
		app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }),
			function(req, res) { res.redirect('/signup?step=steam'); }
		);

		// CONFIGURE BODY PARSER FOR APIS
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json({ limit: '1mb' }));

		// MOUNT INDEX
		app.use('/', indexRouter);

		// AND S3 IMAGES ROUTES
		if (AWSMethods.AWS_ENABLED) app.use('/images', S3ActionsRouter);

		// MOUNT TESTING ROUTE
		app.use('/testRoute', testingRouter);

		// MOUNT API ROUTES
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

		// MOUNT THE ANUS ROUTE
		app.get('*', renderIndex);
	}

})();