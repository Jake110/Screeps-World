const combat = require("utility.combat");

module.exports = {
	capacity_check: function (creep, resource) {
		if (creep.memory.full && creep.store[resource] == 0) {
			creep.memory.full = false;
		}
		if (!creep.memory.full && creep.store.getFreeCapacity() == 0) {
			creep.memory.full = true;
		}
	},

	get_collection_target: function (creep, find_list) {
		let options = [];
		find_list.forEach(function (find_name) {
			options = options.concat(
				creep.room.find(find_name, {
					filter: function (option) {
						if (!combat.avoid_filter(option)) {
							return false;
						}
						if (!option.store) {
							return option.resourceType == RESOURCE_ENERGY;
						}
						if (option.body) {
							let creep_memory = option.memory;
							return (
								creep_memory.role == "harvester" &&
								creep_memory.full
							);
						}
						if (options.deathTime) {
							return option.store[RESOURCE_ENERGY] > 0;
						}
						let structure = STRUCTURE_CONTAINER;
						if (
							creep.memory.role == "worker" &&
							creep.room.storage
						) {
							structure = STRUCTURE_STORAGE;
						}
						return (
							option.structureType == structure &&
							option.store[RESOURCE_ENERGY] > 0
						);
					},
				}),
			);
		});
		let chosen = null;
		let chosen_distance = 999;
		options.forEach(function (option) {
			let energy;
			if (option.store) {
				energy = option.store[RESOURCE_ENERGY];
			} else {
				energy = option.amount;
			}
			creep.room
				.find(FIND_MY_CREEPS, {
					filter: function (_creep) {
						let creep_memory = _creep.memory;
						let dest = creep_memory._move.dest;
						return (
							dest.x == option.pos.x &&
							dest.y == option.pos.y &&
							dest.room == option.pos.roomName &&
							["hauler", "worker"].includes(creep_memory.role) &&
							!creep_memory.full
						);
					},
				})
				.forEach(function (_creep) {
					energy -= _creep.store.getFreeCapacity();
				});
			if (energy > 0) {
				let distance = creep.pos.findPathTo(option).length;
				if (distance < chosen_distance) {
					chosen = option;
					chosen_distance = distance;
				}
			}
		});
		return chosen;
	},
};
