var pick_source = require("pick.source");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
			creep.memory.building = false;
			creep.say("🔄 harvest");
		}
		if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
			creep.memory.building = true;
			creep.say("🚧 build");
		}

		if (creep.memory.building) {
			let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
			if (targets.length) {
				if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(targets[0], {
						visualizePathStyle: { stroke: "#ffffff" },
					});
				}
			}
		} else {
			let _source = pick_source.pick(creep);
			if (creep.harvest(_source) == ERR_NOT_IN_RANGE) {
				creep.moveTo(_source, {
					visualizePathStyle: { stroke: "#ffaa00" },
				});
			}
		}
	},
};
