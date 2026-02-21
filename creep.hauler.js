module.exports = {
	capacity_check: function (creep, resource) {
		if (creep.memory.full && creep.store[resource] == 0) {
			creep.memory.full = false;
		}
		if (!creep.memory.full && creep.store.getFreeCapacity() == 0) {
			creep.memory.full = true;
		}
	},
};
