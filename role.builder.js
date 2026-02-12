var harvest = require("utility.harvest");
var role_harvester = require("role.harvester");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
			creep.memory.building = false;
		}
		if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
			creep.memory.building = true;
		}

		if (creep.memory.building) {
			let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
			if (target) {
				if (creep.build(target) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {
						visualizePathStyle: { stroke: "#ffffff" },
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
