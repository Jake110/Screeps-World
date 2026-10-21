const hauler = require("creep.hauler");
const memory = require("utility.memory");
const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (!creep.memory.remote) {
			let remotes = Memory.rooms[creep.memory.home].remotes;
			for (name in Game.creeps) {
				let _creep = Game.creeps[name];
				if (
					_creep.memory.role != "remote" ||
					_creep.memory.home != creep.memory.home ||
					!_creep.memory.remote
				) {
					continue;
				}
				remotes.splice(remotes.indexOf(_creep.memory.remote), 1);
			}
			if (remotes.length == 0) {
				// This remote creep is not needed, recycling...
				creep.memory.remote = creep.memory.home;
			} else {
				creep.memory.remote = remotes[0];
			}
		}
		let target_room = creep.memory.remote.split("_")[0];
		if (creep.memory.full) {
			target_room = creep.memory.home;
			let road = creep.pos.findInRange(FIND_STRUCTURE, 0, {
				filter: { structureType: STRUCTURE_ROAD },
			});
			if (road) {
				creep.repair(road[0]);
			} else {
				let site = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {
					filter: { structureType: STRUCTURE_ROAD },
				});
				if (!site) {
					creep.pos.createConstructionSite(STRUCTURE_ROAD);
					site = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {
						filter: { structureType: STRUCTURE_ROAD },
					});
				}
				creep.build(site[0]);
			}
		}
		if (creep.room.name == target_room) {
			if (creep.memory.remote == creep.memory.home) {
				// Creep was sent home for recycling
				creep.memory.recycle = creep.room.memory.core;
			} else if (target_room == creep.memory.home) {
				let target = creep.pos.findClosestByPath(FIND_STRUCTURE, {
					filter: function (structure) {
						return (
							[STRUCTURE_LINK, STRUCTURE_STORAGE].indexOf(
								structure.structureType,
							) != -1
						);
					},
				});
				if (
					creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
				) {
					creep.moveTo(deposit_target, {
						visualizePathStyle: { stroke: "#2bff00" },
					});
				}
			} else {
				let target = null;
				memory
					.coord_to_pos(creep.memory.remote.split("_")[1], creep.room)
					.look()
					.forEach(function (item) {
						console.log(item);
						if (item.energyCapacity) {
							target = item;
						}
					});
				let result = creep.harvest(target);
				console.log(
					"Creep [" + creep.name + "] harvest result: " + result,
				);
				console.log("\tTarget: " + target);
				if (result == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			}
		} else {
			if (!scout.travel(target_room, creep, true)) {
				// Cannot reach target room, recycling...
				creep.memory.remote = creep.memory.home;
			}
		}
	},
};
