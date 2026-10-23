const combat = require("utility.combat");
const memory = require("utility.memory");
const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		memory.map_room(creep);
		let target = combat.melee_target(creep);
		if (target) {
			creep.attack(target);
			creep.moveTo(target, {
				visualizePathStyle: { stroke: "#FF0000" },
			});
		} else if (creep.ticksToLive < 400 || creep.hits < creep.hitsMax) {
			scout.return(creep);
		} else {
			scout.explore(creep);
		}
	},
};
