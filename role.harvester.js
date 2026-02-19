var harvest = require("utility.harvest");
var role_upgrader = require("role.upgrader");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		if (creep.memory.full && creep.store[RESOURCE_ENERGY] == 0) {
			creep.memory.full = false;
		}
		if (!creep.memory.full && creep.store.getFreeCapacity() == 0) {
			creep.memory.full = true;
		}

		if (creep.memory.full) {
			if (!harvest.recharge(creep)) {
				role_upgrader.run(creep);
			}
		} else {
			harvest.harvest(creep);
		}
	},
};
