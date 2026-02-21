const combat = require("utility.combat");

module.exports = {
	build: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
		if (target) {
			if (creep.build(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#00ffff" },
				});
			}
			return true;
		}
		return false;
	},
	collect: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
			filter: function (drop) {
				return (
					drop.resourceType == RESOURCE_ENERGY &&
					combat.avoid_filter(drop)
				);
			},
		});
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
				filter: function (tomb) {
					return (
						tomb.store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
						ccombat.avoid_filter(tomb)
					);
				},
			});
		}
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: function (structure) {
					return (
						[STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(
							structure.structureType,
						) &&
						structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
		}
		if (!target) {
			target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
				filter: function (harvester) {
					return (
						harvester.memory.role == "harvester" &&
						harvester.store.getUsedCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});
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
		}
	},
	recharge: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
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
	upgrade: function (creep) {
		if (
			creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE
		) {
			creep.moveTo(creep.room.controller, {
				visualizePathStyle: { stroke: "#7b00ac" },
			});
		}
	},
};
