const harvest = require("creep.harvest");
const hauler = require("creep.hauler")

module.exports = {
	/** @param {Creep} creep **/
	run: function (creep) {
		hauler.capacity_check(creep, RESOURCE_ENERGY)
		if (creep.memory.full) {
			harvest.deposit(creep);
		} else {
			harvest.harvest(creep);
		}
	},
};
