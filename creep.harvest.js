const combat = require("utility.combat");
const hauler = require("creep.hauler");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
			filter: function (_source) {
				return (
					combat.avoid_filter &&
					_source.pos.findInRange(FIND_MY_CREEPS, 5, {
						filter: function (_creep) {
							return (
								_creep.memory.role == "harvester" &&
								_creep.name != creep.name
							);
						},
					}).length == 0
				);
			},
		});
		if (target) {
			if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			}
		}
	},

	/** @param {Creep} creep **/
	deposit: function (creep) {
		let target = creep.pos.findInRange(FIND_STRUCTURES, 4, {
			filter: { structureType: STRUCTURE_CONTAINER },
		});
		if (target.length == 0) {
			if (hauler.recharge(creep)) {
				return null;
			}
			worker.upgrade(creep);
		} else {
			target = target[0];
			if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#2bff00" },
				});
			}
		}
	},
};
