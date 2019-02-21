(function() {
	'use strict';

	module.exports = scheduleTasks;

	function scheduleTasks() {
		var schedule = require('node-schedule'),
			scheduleTasks = new scheduledTasks();

		function scheduledTasks() {

			function dailyStoresLoop() {
				var StoreMethods = require('./../modules/index.js').getMethods().stores,
					currentDay = new Date(),
					weekday = currentDay.getDay();

				StoreMethods.reRollStoreStockFUNC(weekday);
				StoreMethods.healWoundedStoresFunc(weekday);
			}

			function dailyFactionsLoop() {
				var GeneralMethods = require('./../modules/index.js').getMethods().general_methods;
				GeneralMethods.recoverFactionAssetsFunc();
			}

			function dailyConflictsLoop() {
				var GeneralMethods = require('./../modules/index.js').getMethods().general_methods;
				GeneralMethods.generateConflictsFunc();
			}

			function hourlyAdversarialMissionLoop() {
				var API = require('./../routes/api.js'),
					numbers = require("./numbers.js"),
					GeneralMethods = require('./../modules/index.js').getMethods().general_methods,
					currentDay = new Date(),
					weekday = currentDay.getDay(),
					adversarialDays = numbers.modules.missions.adversarialDays,
					isAdversarialDay = API.methods.inArray(weekday, adversarialDays);

				if (isAdversarialDay) {

					console.log("\n ============================= \n");
					console.log("\n Generating adversarial Missions... \n");

					GeneralMethods.generateAdversarialMissionFunc(function() {

						console.log("\n Adversarial Mission generation finished! \n");
						console.log("\n ============================= \n");
					});

				}
			}

			function hourlyMissionLoop() {
				var GeneralMethods = require('./../modules/index.js').getMethods().general_methods;

				console.log("\n ============================= \n");

				console.log("\n Cleaning up Missions... \n");
				GeneralMethods.cleanUpMissionsFunc(function() {

					console.log("\n Handling Conflict results... \n");
					GeneralMethods.handleConflictResultsFunc(function() {

						console.log("\n Generating new Missions... \n");
						GeneralMethods.generateMissionsFunc(function() {

							console.log("\n Hourly Mission loop finished! \n");
							console.log("\n ============================= \n");
						});
					});
				});
			}

			return {
				dailyStoresLoop: dailyStoresLoop,
				dailyFactionsLoop: dailyFactionsLoop,
				dailyConflictsLoop: dailyConflictsLoop,
				hourlyAdversarialMissionLoop: hourlyAdversarialMissionLoop,
				hourlyMissionLoop: hourlyMissionLoop
			};
		}

		function dailySchedule() {
			var dailyValues = "1 0 * * *";
			schedule.scheduleJob(dailyValues, scheduleTasks.dailyStoresLoop);
			schedule.scheduleJob(dailyValues, scheduleTasks.dailyConflictsLoop);
			schedule.scheduleJob(dailyValues, scheduleTasks.dailyFactionsLoop);
		}

		function hourlySchedule() {
			var hourlyValues = "1 * * * *";
			schedule.scheduleJob(hourlyValues, scheduleTasks.hourlyMissionLoop);
			schedule.scheduleJob(hourlyValues, scheduleTasks.hourlyAdversarialMissionLoop);
		}

		dailySchedule();
		hourlySchedule();
	}
})();