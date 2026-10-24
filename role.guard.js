const combat = require("utility.combat");
const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let target = combat.melee_target(creep);
		if (target) {
			creep.attack(target);
			creep.moveTo(target, {
				visualizePathStyle: { stroke: "#FF0000" },
			});
		} else {
			if (
				["enemy", "hostile"].includes(
					Memory.map[creep.room.name].status,
				)
			) {
				memory.map_room(creep, true);
			}
			if (creep.ticksToLive < 400 || creep.hits < creep.hitsMax) {
				scout.return(creep);
			} else {
				scout.explore(creep);
			}
		}
	},
};
