const combat = require("utility.combat");

module.exports = {
	fire: function (room) {
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		}).forEach(function (tower) {
			let energy = tower.store[RESOURCE_ENERGY];
			let capacity = tower.store.getCapacity();
			let acted = false;
			[(10, 20, 50)].forEach(function (range) {
				if (!acted) {
					let hostile = combat.ranged_target(tower.pos, range);
					if (hostile) {
						tower.attack(hostile);
						acted = true;
					}
				}
			});
			[(10, 20, 50)].forEach(function (range) {
				if (!acted && energy > capacity / 4) {
					let damaged_structure = tower.pos.findClosestByRange(
						FIND_STRUCTURES,
						{
							filter: function (structure) {
								if (
									!tower.pos.inRangeTo(structure, range) ||
									(structure.owner && !structure.my)
								) {
									// Ignore structures out of range and owned by another player
									return false;
								}
								return structure.hits < structure.hitsMax;
							},
						},
					);
					if (damaged_structure) {
						tower.repair(damaged_structure);
						acted = true;
					}
				}
			});
			if (!acted && energy > capacity / 3) {
				let damaged_creep = tower.pos.findClosestByRange(
					FIND_MY_CREEPS,
					{
						filter: function (creep) {
							return creep.hits < creep.hitsMax;
						},
					},
				);
				if (damaged_creep) {
					tower.heal(damaged_creep);
					acted = true;
				}
			}
		});
	},
};
