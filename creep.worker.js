const hauler = require("creep.hauler");
const memory = require("utility.memory");
const spawn_util = require("utility.spawn");

module.exports = {
	build: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
			filter: function (site) {
				return site.structureType == STRUCTURE_SPAWN;
			},
		});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
				filter: function (site) {
					return ![
						STRUCTURE_RAMPART,
						STRUCTURE_ROAD,
						STRUCTURE_WALL,
					].includes(site.structureType);
				},
			});
		}
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
				filter: function (site) {
					return [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(
						site.structureType,
					);
				},
			});
		}
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
				filter: function (site) {
					return site.structureType == STRUCTURE_ROAD;
				},
			});
		}
		if (target) {
			let result = creep.build(target);
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#00ffff" },
				});
			} else if (result == ERR_NOT_ENOUGH_RESOURCES) {
				return false;
			}
			return true;
		}
		return false;
	},
	collect: function (creep) {
		if (!hauler.collect(creep)) {
			if (
				creep.room.find(FIND_MY_CREEPS, {
					filter: function (harvester) {
						return harvester.memory.role == "harvester";
					},
				}).length == 0
			) {
				// No Harvesters found in room
				if (creep.room.find(FIND_SOURCES).length == 0) {
					// No Harvesters required in this room
					if (creep.store[RESOURCE_ENERGY] > 0) {
						creep.memory.full = true;
					}
					return null;
				}
				if (
					creep.room.find(FIND_MY_STRUCTURES, {
						filter: function (structure) {
							if (!structure.spawning) {
								return false;
							}
							return (
								Memory.creeps[structure.spawning.name].role ==
								"harvester"
							);
						},
					}).length > 0
				) {
					// A Harvester is being spawned
					return null;
				}
				if (
					creep.room.find(FIND_MY_CREEPS, {
						filter: function (_creep) {
							return _creep.memory.recycle;
						},
					}).length == 0
				) {
					// No Creeps are being recycled
					// Recycle this creep so we can spawn a Harvester
					let nearest_spawn = spawn_util.get_spawn(
						creep.room,
						creep.pos,
						[],
						true,
					);
					if (nearest_spawn) {
						creep.memory.recycle = spawn_util.get_spawn_coord(
							nearest_spawn.room,
							null,
							null,
							null,
							nearest_spawn,
						);
						console.log(
							creep.room.name +
								" - No Harvesters present, recycling: " +
								creep.name,
						);
					}
				}
			}
		}
	},
	upgrade: function (creep) {
		let controller = Game.rooms[creep.memory.home].controller;
		if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
			creep.moveTo(controller, {
				visualizePathStyle: { stroke: "#7b00ac" },
			});
		}
	},
};
