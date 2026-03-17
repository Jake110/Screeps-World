const combat = require("utility.combat");
const hauler = require("creep.hauler");
const memory = require("utility.memory")
const quartermaster = require("creep.quartermaster");
const worker = require("creep.worker");

function deposit_to_link(creep, link, move = true) {
	let result = creep.transfer(link, RESOURCE_ENERGY);
	if (result == ERR_NOT_IN_RANGE && move) {
		creep.moveTo(link, {
			visualizePathStyle: { stroke: "#2bff00" },
		});
	}
	if (link.cooldown == 0) {
		let core_link = quartermaster.get_structure(
			creep.room,
			creep.room.memory.links[0],
			STRUCTURE_LINK,
		);
		if (
			core_link.store.getFreeCapacity(RESOURCE_ENERGY) >=
			link.store[RESOURCE_ENERGY]
		) {
			link.transferEnergy(core_link);
		}
	}
}

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
			let result = creep.harvest(harvest_target)
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(harvest_target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			} else if (result == ERR_NOT_ENOUGH_RESOURCES && creep.ticksToLive < 1000) {
				let closest_spawn = creep.pos.findClosestByPath(creep.room.find(FIND_MY_SPAWNS))
				creep.memory.renew = memory.pos_to_coord(closest_spawn.pos)
			}
		}
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length > 0) {
			deposit_target = deposit_target[0];
			deposit_to_link(creep, deposit_target, false);
		} else {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
			if (deposit_target.length > 0) {
				deposit_target = deposit_target[0];
				creep.transfer(deposit_target, RESOURCE_ENERGY);
			}
		}
	},

	/** @param {Creep} creep **/
	deposit: function (creep) {
		let deposit_target = creep.pos.findInRange(FIND_MY_STRUCTURES, 4, {
			filter: { structureType: STRUCTURE_LINK },
		});
		if (deposit_target.length > 0) {
			deposit_target = deposit_target[0];
			deposit_to_link(creep, deposit_target);
		}
		if (deposit_target.length == 0) {
			deposit_target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			});
		}
		if (deposit_target.length == 0) {
			if (hauler.recharge(creep)) {
				return null;
			}
			worker.upgrade(creep);
		} else {
			deposit_target = deposit_target[0];
			if (
				creep.transfer(deposit_target, RESOURCE_ENERGY) ==
				ERR_NOT_IN_RANGE
			) {
				creep.moveTo(deposit_target, {
					visualizePathStyle: { stroke: "#2bff00" },
				});
			}
		}
	},
};
