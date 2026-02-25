const hauler = require("creep.hauler");

module.exports = {
	run: function (creep) {
		hauler.check_capacity(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			hauler.recharge(creep);
		} else {
			hauler.collect(creep);
		}
	},
};
