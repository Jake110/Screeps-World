const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let target;
		let room = Game.rooms[creep.memory.home];
		console.log(
			"Creep [" +
				creep.name +
				"] harvesting target [" +
				creep.memory.target +
				"]",
		);
		if (creep.memory.target) {
			target = room.find(FIND_SOURCES, {
				filter: { id: creep.memory.target },
			})[0];
		} else {
			let max_harvesters = this.harvester_per_source(creep.room);
			let harvester_check = function (creep_s, source_id) {
				return (
					creep_s.room.find(FIND_MY_CREEPS, {
						filter: function (_creep) {
							return (
								_creep.memory.role == "harvester" &&
								_creep.memory.target == source_id &&
								_creep.name != creep_s.name
							);
						},
					}).length >= max_harvesters
				);
			};
			let sources = room.find(FIND_SOURCES, {
				filter: function (source) {
					return combat.safe_check(source.pos);
				},
			});
			let source_active, source_all;
			let refresh_active,
				refresh_all = 300;
			sources.forEach(function (source) {
				console.log("Checking Source at: " + source.pos);
				if (harvester_check(creep, source)) {
					console.log("\tFully staffed");
					// ignore sources that are already fully staffed
					return null;
				}
				let timer =
					source.ticksToRegeneration -
					creep.pos.findPathTo(source).length;
				console.log("\tTimer: " + timer);
				console.log("\tEnergy: " + source.energy);
				if (
					(source.energy > 0 || timer <= 0) &&
					timer < refresh_active
				) {
					source_active = source;
					refresh_active = timer;
				}
				if (timer < refresh_all) {
					source_all = source;
					refresh_all = timer;
				}
			});
			console.log("Active Source: " + source_active);
			console.log("Any Source: " + source_all);
			if (source_active) {
				target = source_active;
			} else if (source_all) {
				target = source_all;
			}
			if (target) {
				creep.memory.target = target.id;
			}
		}
		console.log(target);
		if (target) {
			let result = creep.harvest(target);
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			} else if (result == ERR_NOT_ENOUGH_RESOURCES) {
				// Reset the target if it's empty
				this.reset_target(creep);
			}
		} else {
			console.log(
				"Harvester [" +
					creep.name +
					"] cannot find a target source in [" +
					creep.memory.home +
					"]",
			);
		}
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length == 0) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 3, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (deposit_target.length > 0) {
			deposit_target = deposit_target[0];
			creep.transfer(deposit_target, RESOURCE_ENERGY);
		}
	},
	/** @param {Room} room **/
	harvester_per_source: function (room) {
		let best_harvester = 3;
		room.find(FIND_MY_CREEPS, {
			filter: function (creep) {
				if (creep.memory.role == "harvester") {
					best_harvester = Math.max(
						best_harvester,
						creep.body.length,
					);
				}
			},
		});
		return 3000 / (best_harvester - 1) / 300;
	},
	/** @param {Creep} creep **/
	deposit: function (creep) {
		this.reset_target(creep);
		let invalid_target_check = function (target_list) {
			let invalid = true;
			if (target_list.length > 0) {
				let target = target_list[0];
				if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					invalid = false;
				}
			}
			return invalid;
		};
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 4, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (invalid_target_check(deposit_target)) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (invalid_target_check(deposit_target)) {
			if (creep.body.length > 4) {
				// We want to focus on building the container if it's missing
				let sites = creep.pos.findInRange(
					FIND_MY_CONSTRUCTION_SITES,
					1,
					{
						filter: { structureType: STRUCTURE_CONTAINER },
					},
				);
				if (sites.length > 0) {
					creep.build(sites[0]);
					return null;
				}
			}
			if (hauler.recharge(creep)) {
				return null;
			}
			worker.upgrade(creep);
		} else {
			deposit_target = deposit_target[0];
			let result = null;
			if (deposit_target.structureType == STRUCTURE_CONTAINER) {
				// If we're depositing into a container, make sure it's not about to die
				if (deposit_target.hits / deposit_target.hitsMax < 0.5) {
					result = creep.repair(deposit_target);
				}
			}
			result = creep.transfer(deposit_target, RESOURCE_ENERGY);
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(deposit_target, {
					visualizePathStyle: { stroke: "#2bff00" },
				});
			}
		}
	},
	reset_target: function (creep) {
		creep.memory.target = null;
	},
};
