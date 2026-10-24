const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		if (creep.ticksToLive < 400 || creep.hits < creep.hitsMax) {
			scout.return(creep);
		} else {
			scout.explore(creep);
		}
	},
};
