const hauler = require("creep.hauler");
const memory = require("utility.memory");

module.exports = {
	build: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
			filter: function (site) {
				return site.structureType != STRUCTURE_ROAD;
			},
		});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
				filter: function (site) {
					return site.structureType == STRUCTURE_ROAD;
				},
			});
		}
		if (target) {
			if (creep.build(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#00ffff" },
				});
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
					let nearest_spawn =
						creep.pos.findClosestByPath(FIND_MY_SPAWNS);
					if (nearest_spawn) {
						creep.memory.recycle = memory.pos_to_coord(
							nearest_spawn.pos,
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
		if (
			creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE
		) {
			creep.moveTo(creep.room.controller, {
				visualizePathStyle: { stroke: "#7b00ac" },
			});
		}
	},
};
