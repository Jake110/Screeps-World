/** @param {Creep} creep **/
function pick(creep) {
	pathing_options = {
		filter: function (target) {
			if (target.energy < creep.store.getFreeCapacity()) {
				return false;
			}
			let hostiles = target.pos.findInRange(FIND_HOSTILE_CREEPS, 10, {
				filter: function (object) {
					return (
						object.getActiveBodyparts(ATTACK) != 0 ||
						object.getActiveBodyparts(RANGED_ATTACK) != 0
					);
				},
			});
			return hostiles.length == 0;
		},
	};
	pickup = creep.pos.findClosestByPath(
		FIND_DROPPED_RESOURCES,
		pathing_options,
	);
	_source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, pathing_options);
	if (pickup) {
		return creep.pos.findClosestByPath([pickup, _source]);
	}
	return _source;
}

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let target = pick(creep);
		if (target) {
			if (target.energyCapacity == null) {
				result = creep.pickup(target);
			} else {
				result = creep.harvest(target);
			}
			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: { stroke: "#fff23e" },
				});
			}
		}
	},

	/** @param {Creep} creep **/
	recharge: function (creep) {
		let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (
					(structure.structureType == STRUCTURE_EXTENSION ||
						structure.structureType == STRUCTURE_SPAWN ||
						structure.structureType == STRUCTURE_TOWER) &&
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
		} else {
			return false;
		}
	},
};
