var harvest = require("creep.harvest");

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
			if (
				creep.upgradeController(creep.room.controller) ==
				ERR_NOT_IN_RANGE
			) {
				creep.moveTo(creep.room.controller, {
					visualizePathStyle: { stroke: "#7b00ac" },
				});
			}
		} else {
			harvest.harvest(creep);
		}
	},
};
