const combat = require("utility.combat");
const hauler = require("creep.hauler");
const quartermaster = require("creep.quartermaster");
const worker = require("creep.worker");

function deposit_to_link(creep, link, move = true) {
	let result = creep.transfer(link, RESOURCE_ENERGY);
	if (result == ERR_NOT_IN_RANGE && move) {
		creep.moveTo(deposit_target, {
			visualizePathStyle: { stroke: "#2bff00" },
		});
	}
	if (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
		let core_link = quartermaster.get_structure(
			creep.room,
			creep.room.memory.links[0],
			STRUCTURE_LINK,
		);
		link.transferEnergy(core_link);
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
			if (creep.harvest(harvest_target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(harvest_target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
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
