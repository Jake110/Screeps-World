const combat = require("utility.combat");
const memory = require("utility.memory");
const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let home = Game.rooms[creep.memory.home];
		memory.map_room(creep);
		let target = combat.melee_target(creep);
		if (target) {
			creep.attack(target);
			creep.moveTo(target, {
				visualizePathStyle: { stroke: "#FF0000" },
			});
		} else if (creep.ticksToLive < 400 || creep.hits < creep.hitsMax) {
			scout.return(home, creep);
		} else {
			scout.explore(home, creep);
		}
	},
};
