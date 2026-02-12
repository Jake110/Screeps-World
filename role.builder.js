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
			let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
			if (targets.length) {
				if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(targets[0], {
						visualizePathStyle: { stroke: "#ffffff" },
					});
				}
			} else {
				role_harvester.run(creep);
			}
		} else {
			harvest(creep);
		}
	},
};
