const hauler = require("creep.hauler");
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			if (creep.room.controller.ticksToDowngrade > 1000) {
				if (worker.build(creep)) {
					return null;
				}
				if (hauler.recharge(creep)) {
					return null;
				}
			}
			worker.upgrade(creep);
		} else {
			worker.collect(creep);
		}
	},
};
