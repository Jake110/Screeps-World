const combat = require("utility.combat");

function get_collection_target(creep, find_list, storage_override = false) {
	let creep_memory = creep.memory;
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
						let _creep_memory = option.memory;
						return (
							((creep_memory.role == "hauler" &&
								_creep_memory.role == "harvester") ||
								(creep_memory.role == "worker" &&
									_creep_memory.role == "hauler")) &&
							option.store.getFreeCapacity() > 0
						);
					}
					if (option.deathTime || option.destroyTime) {
						return option.store[RESOURCE_ENERGY] > 0;
					}
					let structure = STRUCTURE_CONTAINER;
					if (
						creep.room.memory.storage &&
						(creep_memory.role == "worker" || storage_override)
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
		let distance = creep.pos.findPathTo(option).length;
		creep.room
			.find(FIND_MY_CREEPS, {
				filter: function (_creep) {
					let creep_memory = _creep.memory;
					if (
						_creep.name == creep.name ||
						!creep_memory._move ||
						!["hauler", "worker"].includes(creep_memory.role) ||
						creep_memory.full ||
						distance < _creep.pos.findPathTo(option).length
					) {
						return false;
					}
					let dest = creep_memory._move.dest;
					return (
						dest.x == option.pos.x &&
						dest.y == option.pos.y &&
						dest.room == option.pos.roomName
					);
				},
			})
			.forEach(function (_creep) {
				energy -= _creep.store.getFreeCapacity();
			});
		if (energy > 0) {
			if (distance < chosen_distance) {
				chosen = option;
				chosen_distance = distance;
			}
		}
	});
	return chosen;
}

module.exports = {
	capacity_check: function (creep, resource) {
		if (creep.memory.full && creep.store[resource] == 0) {
			creep.memory.full = false;
		}
		if (!creep.memory.full && creep.store.getFreeCapacity() == 0) {
			creep.memory.full = true;
		}
	},
	collect: function (creep) {
		let target = get_collection_target(creep, [
			FIND_DROPPED_RESOURCES,
			FIND_TOMBSTONES,
		]);
		if (!target) {
			target = get_collection_target(creep, [FIND_RUINS]);
		}
		if (!target) {
			target = get_collection_target(creep, [FIND_STRUCTURES]);
		}
		if (!target) {
			target = get_collection_target(creep, [FIND_MY_CREEPS]);
		}
		let creep_memory = creep.memory;
		if (
			!target &&
			creep_memory.role == "hauler" &&
			creep.room.memory.storage
		) {
			target = get_collection_target(creep, [FIND_STRUCTURES], true);
		}
		if (target) {
			let result;
			if (!target.store) {
				result = creep.pickup(target);
			} else if (!target.body) {
				result = creep.withdraw(target, RESOURCE_ENERGY);
			} else {
				result = target.transfer(creep, RESOURCE_ENERGY);
			}
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			}
			return true;
		}
		if (creep_memory.role == "hauler" && creep.store[RESOURCE_ENERGY] > 0) {
			creep_memory.full = true;
		}
		return false;
	},
	get_collection_target: get_collection_target,
	recharge: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return (
					structure.structureType == STRUCTURE_TOWER &&
					structure.store.getFreeCapacity(RESOURCE_ENERGY) >
						structure.store.getCapacity() / 3
				);
			},
		});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
				filter: function (structure) {
					return (
						[
							STRUCTURE_EXTENSION,
							STRUCTURE_SPAWN,
							STRUCTURE_TOWER,
						].includes(structure.structureType) &&
						structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
		}
		let creep_memory = creep.memory;
		if (!target && creep_memory.role == "harvester") {
			target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
				filter: function (_creep) {
					let _creep_memory = _creep.memory;
					return (
						_creep_memory.role == "hauler" && !_creep_memory.full
					);
				},
			});
		}
		if (!target && ["harvester", "hauler"].includes(creep_memory.role)) {
			target = creep.room.find(FIND_MY_STRUCTURES, {
				filter: { structureType: STRUCTURE_STORAGE },
			})[0];
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
					filter: function (_creep) {
						let _creep_memory = _creep.memory;
						return (
							_creep_memory.role == "worker" &&
							!_creep_memory.full
						);
					},
				});
			}
			if (!target) {
				if (creep.store.getFreeCapacity() > 0) {
					creep_memory.full = false;
				} else {
					target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
						filter: function (structure) {
							if (
								structure.structureType == STRUCTURE_CONTAINER
							) {
								return structure.store.getFreeCapacity > 0;
							}
						},
					});
				}
			}
		}
		if (target) {
			if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#2bff00" },
				});
			}
			return true;
		}
		return false;
	},
};
