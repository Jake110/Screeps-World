const hauler = require("creep.hauler");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			if (creep.room.controller.ticksToDowngrade > 1000) {
				if (
					creep.room.memory.core &&
					creep.room.find(FIND_MY_SPAWNS).length == 0
				) {
					if (worker.build(creep)) {
						return null;
					}
				}
				if (hauler.recharge(creep)) {
					return null;
				}
				if (worker.build(creep)) {
					return null;
				}
			}
			worker.upgrade(creep);
		} else {
			worker.collect(creep);
		}
	},
};
