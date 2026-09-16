const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let home = Game.rooms[creep.memory.home];
		if (home.memory.map[creep.room.name].status == "pending") {
			scout.map(home, creep);
		} else if (creep.ticksToLive < 500) {
			scout.return(home, creep)
		} else {
			scout.explore(home, creep);
		}
	},
};
