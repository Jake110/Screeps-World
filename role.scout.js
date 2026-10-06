const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let home = Game.rooms[creep.memory.home];
		let pending = false;
		let map = home.memory.map[creep.room.name];
		if (map == null) {
			pending = true;
		} else if (map.status == "pending") {
			pending = true;
		}
		if (pending && creep.hits == creep.hitsMax) {
			scout.map(home, creep);
		} else if (creep.ticksToLive < 500 || creep.hits < creep.hitsMax) {
			scout.return(home, creep);
		} else {
			scout.explore(home, creep);
		}
	},
};
