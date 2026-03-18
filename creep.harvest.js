const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let harvest_target = creep.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				let no_rivals = true;
				if (creep.body.length > 4) {
					no_rivals =
						_source.pos.findInRange(FIND_MY_CREEPS, 2, {
							filter: function (_creep) {
								return (
									_creep.memory.role == "harvester" &&
									_creep.name != creep.name
								);
							},
						}).length == 0;
				}
				return combat.avoid_filter && no_rivals;
			},
		});
		if (harvest_target) {
			let result = creep.harvest(harvest_target);
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(harvest_target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			} else if (
				result == ERR_NOT_ENOUGH_RESOURCES &&
				creep.ticksToLive < 1000
			) {
				let closest_spawn = creep.pos.findClosestByPath(
					creep.room.find(FIND_MY_SPAWNS),
				);
				creep.memory.renew = memory.pos_to_coord(closest_spawn.pos);
			}
		}
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length == 0) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (deposit_target.length > 0) {
			deposit_target = deposit_target[0];
			creep.transfer(deposit_target, RESOURCE_ENERGY);
		}
	},

	/** @param {Creep} creep **/
	deposit: function (creep) {
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 4, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length == 0) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (deposit_target.length == 0) {
			// We want to focus on building the container if it's missing
			let sites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
			if (sites.length > 0) {
				creep.build(sites[0]);
				return null;
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
};
