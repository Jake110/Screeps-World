var harvest = require("utility.harvest");
var role_harvester = require("role.harvester");

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
			let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
			if (target) {
				if (creep.build(target) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {
						visualizePathStyle: { stroke: "#00ffff" },
					});
				}
			} else {
				role_harvester.run(creep);
			}
		} else {
			harvest.harvest(creep);
		}
	},
};
