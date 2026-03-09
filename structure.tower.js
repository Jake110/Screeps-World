const combat = require("utility.combat");

module.exports = {
	fire: function (room) {
		let big_hit_count = 1000000000;
		let towers = [];
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		}).forEach(function (tower) {
			let fire = function (range) {
				let hostile = combat.ranged_target(tower.pos, range);
				if (hostile) {
					tower.attack(hostile);
					return true;
				}
				return false;
			};
			let heal = function (range) {
				let most_damaged_creep;
				let hit_percentage = 1;
				tower.pos
					.findInRange(FIND_MY_CREEPS, range)
					.forEach(function (creep) {
						let hit_perc = creep.hits / creep.hitsMax;
						if (hit_perc < hit_percentage) {
							most_damaged_creep = creep;
							hit_percentage = hit_perc;
						}
					});
				if (most_damaged_creep) {
					tower.heal(most_damaged_creep);
					return true;
				}
				return false;
			};
			let acted = false;
			[fire, heal].forEach(function (action) {
				[10, 20, 50].forEach(function (range) {
					if (!acted) {
						acted = action(range);
					}
				});
			});
			if (!acted) {
				let weakest;
				let lowest_hits = big_hit_count;
				tower.room
					.find(FIND_STRUCTURES, {
						filter: function (structure) {
							return (
								(!structure.owner || structure.my) &&
								structure.structureType == STRUCTURE_RAMPART
							);
						},
					})
					.forEach(function (defence) {
						let defence_hits = defence.hits;
						if (defence_hits < lowest_hits && defence_hits < 1000) {
							weakest = defence;
							lowest_hits = defence_hits;
						}
					});
				if (weakest) {
					tower.repair(weakest);
				} else if (
					tower.store[RESOURCE_ENERGY] >
					tower.store.getCapacity(RESOURCE_ENERGY) / 2
				) {
					towers.push(tower);
				}
			}
		});
		let emergency_repair = function (tower) {
			let weakest;
			let lowest_hits = big_hit_count;
			tower.room
				.find(FIND_STRUCTURES, {
					filter: function (structure) {
						return (
							(!structure.owner || structure.my) &&
							[STRUCTURE_RAMPART, STRUCTURE_WALL].includes(
								structure.structureType,
							)
						);
					},
				})
				.forEach(function (defence) {
					let defence_hits = defence.hits;
					if (defence_hits < lowest_hits && defence_hits < 10000) {
						weakest = defence;
						lowest_hits = defence_hits;
					}
				});
			return weakest;
		};
		let repair = function (tower) {
			let weakest;
			let lowest_hits = big_hit_count;
			tower.room
				.find(FIND_STRUCTURES, {
					filter: function (structure) {
						return !structure.owner || structure.my;
					},
				})
				.forEach(function (structure) {
					let defence_hits = structure.hits;
					if (
						defence_hits < lowest_hits &&
						defence_hits < structure.hitsMax
					) {
						weakest = structure;
						lowest_hits = defence_hits;
					}
				});
			return weakest;
		};
		[emergency_repair, repair].forEach(function (action) {
			let target = true;
			while (target && towers.length > 0) {
				let tower = towers.pop();
				target = action(tower);
				if (target) {
					tower.repair(target);
				} else {
					towers.push(tower);
				}
			}
		});
	},
};
