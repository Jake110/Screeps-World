const hauler = require("creep.hauler")
const worker = require("creep.worker");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY)
		if (creep.memory.full) {
			if (worker.recharge(creep)) {
				return null
			}
			if (worker.build(creep)) {
				return null
			}
			worker.upgrade(creep)
		} else {
			worker.collect(creep);
		}
	},
};
