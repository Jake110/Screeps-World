const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let home = Game.rooms[creep.memory.home];
		memory.map(home, creep);
		if (creep.ticksToLive < 500 || creep.hits < creep.hitsMax) {
			scout.return(home, creep);
		} else {
			scout.explore(home, creep);
		}
	},
};
