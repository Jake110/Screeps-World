const combat = require("utility.combat");

module.exports = {
	run: function (creep) {
		let creep_memory = creep.memory;
		let target = combat.melee_target(creep);
		if (target) {
			creep_memory.stand_down_in = combat.stand_down_in;
			if (creep.attack(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#FF0000" },
				});
			}
		} else if (creep_memory.stand_down_in == 0) {
			let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
			if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
				creep.moveTo(spawn, {
					visualizePathStyle: { stroke: "#000000" },
				});
			}
		} else {
			creep_memory.stand_down_in--;
			creep.moveTo(creep.room.controller, {
				visualizePathStyle: { stroke: "#008000" },
			});
		}
	},
};
