var harvest = require("utility.harvest");
var role_upgrader = require("role.upgrader");

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		if (creep.store.getFreeCapacity() > 0) {
			harvest.harvest(creep);
		} else {
			if (!harvest.recharge(creep)) {
				role_upgrader.run(creep);
			}
		}
	},
};
