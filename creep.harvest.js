const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		console.log("Creep body size: " + creep.body.length);
		if (creep.body.length > 4) {
			let sources = creep.pos.findInRange(FIND_ACTIVE_SOURCES, 1);
			let harvested = false;
			console.log("Source in range? " + sources.length > 0);
			if (sources.length > 0) {
				if (creep.harvest(sources[0]) != ERR_NOT_ENOUGH_RESOURCES) {
					harvested = true;
				}
			}
			console.log("Harvested? " + harvested);
			if (!harvested) {
				let chosen_pos = null;
				let chosen_dist = 999;
				creep.room.memory.containers.forEach(function (coord) {
					console.log("\tChecking: " + coord);
					let pos = memory.coord_to_pos(coord, creep.room);
					console.log("Pos: " + pos);
					if (!combat.safe_check(pos)) {
						console.log("Not safe");
						return null;
					}
					let dist = creep.pos.findPathTo(pos).length;
					console.log("Dist: " + dist);
					if (
						creep.room.find(FIND_MY_CREEPS, {
							filter: function (_creep) {
								console.log("Comparing to: " + _creep.name);
								let _creep_memory = _creep.memory;
								if (
									_creep_memory.role != "harvester" ||
									_creep.name == creep.name
								) {
									console.log("skipping creep check");
									return false;
								}
								let at_pos =
									_creep.pos.x == pos.x &&
									_creep.pos.y == pos.y;
								console.log("At pos? " + at_pos);
								let get_there_first = false;
								if (_creep_memory._move) {
									let target =
										_creep_memory._move.dest.x == pos.x &&
										_creep_memory._move.dest.y == pos.y;
									let closer =
										_creep.pos.findPathTo(pos).length <
										dist;
									if (target && closer) {
										get_there_first = true;
									}
								}
								console.log(
									"Will they get their first? " +
										get_there_first,
								);
								return at_pos || get_there_first;
							},
						}).length > 0
					) {
						return null;
					}
					if (dist < chosen_dist) {
						console.log("\t\t\tChosen: " + pos);
						chosen_pos = pos;
						chosen_dist = dist;
					}
				});
				if (chosen_pos) {
					creep.moveTo(pos, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			}
		} else {
			console.log("Running low level harvester code");
			let harvest_target = creep.pos.findClosestByPath(FIND_SOURCES, {
				filter: function (source) {
					return combat.safe_check(source);
				},
			});
			if (harvest_target) {
				console.log("Harvesting from: " + harvest_target.pos);
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
			if (creep.body.length > 4) {
				// We want to focus on building the container if it's missing
				let sites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
					filter: { structureType: STRUCTURE_CONTAINER },
				});
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
};
