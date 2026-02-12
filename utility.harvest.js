function pick(creep) {
	return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
		filter: function (_source) {
			console.log(
				"Checking Source at: [" +
					_source.pos.x +
					", " +
					_source.pos.y +
					"]",
			);
			if (_source.energy < creep.store.getFreeCapacity()) {
				return false;
			}
			let hostiles = _source.pos.findInRange(FIND_HOSTILE_CREEPS, 10, {
				filter: function (object) {
					return (
						object.getActiveBodyparts(ATTACK) != 0 ||
						object.getActiveBodyparts(RANGED_ATTACK) != 0
					);
				},
			});
			if (hostiles.length > 0) {
				console.log("\tHostile Found!");
				return false;
			}
			return true;
		},
	});
}

module.exports = {
	/** @param {Creep} creep **/
	harvest: function (creep) {
		let _source = pick(creep);
		if (!_source) {
			return null;
		}
		if (creep.harvest(_source) == ERR_NOT_IN_RANGE) {
			creep.moveTo(_source, {
				visualizePathStyle: { stroke: "#ffaa00" },
			});
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
					visualizePathStyle: { stroke: "#ffffff" },
				});
			}
			return true;
		} else {
			return false;
		}
	},
};
