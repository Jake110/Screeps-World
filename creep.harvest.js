const combat = require("utility.combat");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
			filter: combat.avoid_filter,
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
			if (worker.recharge(creep)) {
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
