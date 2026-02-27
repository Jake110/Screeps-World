const combat = require("utility.combat");

module.exports = {
	run: function (creep) {
		let target = combat.heal_target(creep);
		if (target) {
			creep_memory.stand_down_in = combat.stand_down_in;
			if (creep.heal(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#008000" },
				});
				creep.rangedHeal(target);
			}
		} else if (creep_memory.stand_down_in == 0) {
			let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
			if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
				creep.moveTo(spawn, {
					visualizePathStyle: { stroke: "#000000" },
				});
			}
		} else {
			let grunt = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
				filter: function (_creep) {
					return _creep.memory.role == "grunt";
				},
			});
			if (grunt) {
				creep.moveTo(grunt, {
					visualizePathStyle: { stroke: "#008000" },
					range: 1,
				});
			} else {
				creep_memory.stand_down_in--;
				creep.moveTo(creep.room.controller, {
					visualizePathStyle: { stroke: "#008000" },
					range: 1,
				});
			}
		}
	},
};
