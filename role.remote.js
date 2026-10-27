const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory");
const remote = require("creep.remote");
const scout = require("creep.scout");
const spawn_util = require("utility.spawn");

module.exports = {
	run: function (creep) {
		if (creep.ticksToLive < 300 || creep.hits < creep.hitsMax) {
			if (!combat.safe_check(creep, 50)) {
				memory.map_room(creep, true);
			}
			scout.return(creep);
			return null;
		}
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		remote.road_check(creep);
		remote.confirm_remote_source(creep);
		if (remote.build_and_scavenge(creep)) {
			return null;
		}
		let target_room = creep.memory.remote.split("_")[0];
		if (creep.memory.full) {
			target_room = creep.memory.home;
		}
		if (creep.room.name == target_room) {
			if (target_room == creep.memory.home) {
				let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
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
					creep.moveTo(target, {
						visualizePathStyle: { stroke: "#2bff00" },
					});
				}
			} else {
				let target = null;
				memory
					.coord_to_pos(creep.memory.remote.split("_")[1], creep.room)
					.look()
					.forEach(function (item) {
						if (item.source) {
							target = item.source;
						}
					});
				let result = creep.harvest(target);
				if (
					[ERR_NOT_ENOUGH_RESOURCES, ERR_NOT_IN_RANGE].indexOf(
						result,
					) != -1
				) {
					if (
						result == ERR_NOT_ENOUGH_RESOURCES &&
						target.ticksToRegeneration > 150 &&
						creep.store.getUsedCapacity() >
							creep.store.getFreeCapacity()
					) {
						// If we're over half full and the source is empty, move on
						creep.memory.full = true;
					} else {
						creep.moveTo(target, {
							visualizePathStyle: { stroke: "#fff23e" },
						});
					}
				}
			}
		} else {
			if (!scout.travel(target_room, creep, true)) {
				// Cannot reach target room, recycling...
				creep.memory.recycle = spawn_util.get_spawn_coord(
					Game.rooms[creep.memory.home],
					null,
					[],
					true,
				);
			}
		}
	},
};
