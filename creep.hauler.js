const combat = require("utility.combat");
const memory = require("utility.memory");
const quartermaster = require("creep.quartermaster");

function get_collection_target(
	creep,
	find_list,
	storage_override = false,
	dismantle = false,
) {
	let creep_memory = creep.memory;
	let room = creep.room;
	let options = [];
	if (
		find_list.includes(FIND_STRUCTURES) &&
		!dismantle &&
		room.memory.links[0]
	) {
		options.push(
			quartermaster.get_structure(
				room,
				room.memory.links[0],
				STRUCTURE_LINK,
			),
		);
	}
	find_list.forEach(function (find_name) {
		options = options.concat(
			room.find(find_name, {
				filter: function (option) {
					if (!combat.safe_check(option)) {
						return false;
					}
					if (dismantle) {
						let coord = memory.pos_to_coord(option.pos);
						console.log("---------- Checking: " + coord);
						switch (option.structureType) {
							case STRUCTURE_CONTAINER:
								coord_list = room.memory.containers;
								break;
							case STRUCTURE_EXTENSION:
								coord_list = room.memory.extensions;
								break;
							case STRUCTURE_LINK:
								coord_list = room.memory.links;
								break;
							case STRUCTURE_RAMPART:
								coord_list = room.memory.ramparts;
								break;
							case STRUCTURE_ROAD:
								coord_list = room.memory.roads;
								break;
							case STRUCTURE_SPAWN:
								coord_list = room.memory.spawns;
								break;
							case STRUCTURE_STORAGE:
								coord_list = [room.memory.storage];
								break;
							case STRUCTURE_TOWER:
								coord_list = room.memory.towers;
								break;
							case STRUCTURE_WALL:
								coord_list = room.memory.walls;
								console.log("Wall hits: " + option.hits);
								if (!option.hits) {
									return false;
								}
								console.log(!coord_list.includes(coord));
								break;
							default:
								return false;
						}
						return !coord_list.includes(coord);
					}
					if (!option.store) {
						return option.resourceType == RESOURCE_ENERGY;
					}
					if (option.body) {
						let _creep_memory = option.memory;
						let target_roles = ["harvester"];
						if (creep_memory.role == "worker") {
							target_roles.push("hauler");
						}
						if (room.controller.level >= 5) {
							target_roles.shift();
						}
						return (
							target_roles.includes(_creep_memory.role) &&
							option.store.getFreeCapacity() > 0
						);
					}
					if (option.deathTime || option.destroyTime) {
						return option.store[RESOURCE_ENERGY] > 0;
					}
					let structure = STRUCTURE_CONTAINER;
					if (
						(creep_memory.role == "worker" && !storage_override) ||
						(creep_memory.role == "hauler" && storage_override)
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
		if (dismantle) {
			energy = option.hits / 200;
		} else if (option.store) {
			energy = option.store[RESOURCE_ENERGY];
		} else {
			energy = option.amount;
		}
		let accessable = false;
		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				if ((x == 0) & (y == 0) || accessable) {
					continue;
				}
				let pos = room.getPositionAt(
					option.pos.x + x,
					option.pos.y + y,
				);
				accessable = _.every(pos.look(), function (item) {
					if (item.type == LOOK_TERRAIN) {
						return item.terrain !== "wall";
					}
					return true;
				});
			}
		}
		if (!accessable) {
			return null;
		}
		let distance = creep.pos.findPathTo(option).length;
		room.find(FIND_MY_CREEPS, {
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
		}).forEach(function (_creep) {
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

function get_home_room(creep) {
	return Game.rooms[creep.memory.home];
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
		let creep_memory = creep.memory;
		let dismantle = false;
		if (!target && creep_memory.role == "worker") {
			target = get_collection_target(
				creep,
				[FIND_STRUCTURES],
				false,
				true,
			);
			if (target) {
				dismantle = true;
			}
		}
		if (!target) {
			target = get_collection_target(creep, [FIND_STRUCTURES]);
		}
		if (!target) {
			target = get_collection_target(creep, [FIND_MY_CREEPS]);
		}
		let hauler_override =
			creep.room.memory.storage && creep.room.controller.level >= 4;
		let worker_override =
			creep.room.find(FIND_MY_CREEPS, {
				filter: function (_creep) {
					return _creep.memory.role == "hauler";
				},
			}) == 0 || creep.room.controller.level < 4;
		if (
			!target &&
			((creep_memory.role == "hauler" && hauler_override) ||
				(creep_memory.role == "worker" && worker_override))
		) {
			target = get_collection_target(creep, [FIND_STRUCTURES], true);
		}
		if (target) {
			let result;
			if (dismantle) {
				result = creep.dismantle(target);
			}
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
		} else if (creep.store[RESOURCE_ENERGY] > 0) {
			creep_memory.full = true;
		}
		return false;
	},
	get_collection_target: get_collection_target,
	get_home_room: get_home_room,
	recharge: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return (
					structure.structureType == STRUCTURE_TOWER &&
					structure.store[RESOURCE_ENERGY] <
						structure.store.getCapacity(RESOURCE_ENERGY) / 3
				);
			},
		});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
				filter: function (structure) {
					if (
						structure.structureType == STRUCTURE_EXTENSION &&
						!creep.room.memory.extensions.includes(
							memory.pos_to_coord(structure.pos),
						)
					) {
						// Ignore Extensions marked for dismantling
						return false;
					}
					return (
						[STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(
							structure.structureType,
						) &&
						structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
		}
		let creep_memory = creep.memory;
		if (!target && creep_memory.role == "hauler") {
			target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
				filter: function (structure) {
					return (
						structure.structureType == STRUCTURE_TOWER &&
						structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
		}
		if (!target && creep_memory.role == "harvester") {
			target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
				filter: function (_creep) {
					return (
						_creep.memory.role == "hauler" &&
						_creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
		}
		if (!target && ["harvester", "hauler"].includes(creep_memory.role)) {
			target = creep.room.find(FIND_MY_STRUCTURES, {
				filter: function (structure) {
					return structure.structureType == STRUCTURE_STORAGE;
				},
			})[0];
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
					filter: function (_creep) {
						return (
							_creep.memory.role == "worker" &&
							_creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0
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
