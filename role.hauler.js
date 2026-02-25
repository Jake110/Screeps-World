const hauler = require("creep.hauler");

module.exports = {
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			hauler.recharge(creep);
		} else {
			hauler.collect(creep);
		}
	},
};
