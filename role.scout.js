const memory = require("utility.memory");
const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let home = Game.rooms[creep.memory.home];
		memory.map_room(creep);
		console.log("Scout [" + creep.name + "]");
		console.log("\tTicks to live: " + creep.ticksToLive);
		console.log("\tHealth: " + creep.hits + "/" + creep.hitsMax);
		if (creep.ticksToLive < 500 || creep.hits < creep.hitsMax) {
			scout.return(home, creep);
		} else {
			scout.explore(home, creep);
		}
	},
};
