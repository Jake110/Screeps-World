module.exports = {
	fire: function (room) {
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		}).forEach(function (tower) {
			let damaged_structure = tower.pos.findClosestByRange(
				FIND_STRUCTURES,
				{
					filter: (structure) => structure.hits < structure.hitsMax,
				},
			);
			if (damaged_structure) {
				tower.repair(damaged_structure);
			}

			let closest_hostile =
				tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
			if (closest_hostile) {
				tower.attack(closest_hostile);
			}
		});
	},
};
