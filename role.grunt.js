const combat = require("utility.combat");
const memory = require("utility.memory");

module.exports = {
	run: function (creep) {
		let target = combat.melee_target(creep);
		if (target) {
			if (creep.attack(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#FF0000" },
				});
			}
		} else {
			creep.moveTo(creep.room.controller, {
				visualizePathStyle: { stroke: "#008000" },
			});
		}
	},
};
