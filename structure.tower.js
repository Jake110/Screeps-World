const combat = require("utility.combat");

module.exports = {
	fire: function (room) {
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		}).forEach(function (tower) {
			[10, 20, 50].forEach(function (range) {
				let hostile = combat.ranged_target(tower.pos, range);
				if (hostile) {
					tower.attack(hostile);
					return null;
				}
				let damaged_structure = tower.pos.findClosestByRange(
					FIND_MY_STRUCTURES,
					{
						filter: function (structure) {
							if (tower.inRangeTo(structure, range)) {
								return false;
							}
							return structure.hits < structure.hitsMax;
						},
					},
				);
				if (damaged_structure) {
					tower.repair(damaged_structure);
					return null;
				}
			});
		});
	},
};
