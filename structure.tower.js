const combat = require("utility.combat");

module.exports = {
	fire: function (room) {
		let towers = [];
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		}).forEach(function (tower) {
			let acted = false;
			let fire = function (range) {
				let hostile = combat.ranged_target(tower.pos, range);
				if (hostile) {
					tower.attack(hostile);
					acted = true;
				}
			};
			let heal = function (range) {
				let most_damaged_creep;
				let hit_percentage = 1;
				tower.pos
					.findInRange(FIND_MY_CREEPS, range)
					.forEach(function (creep) {
						if (creep.hits / creep.hitsMax < hit_percentage) {
							most_damaged_creep = creep;
						}
					});
				if (most_damaged_creep) {
					tower.heal(most_damaged_creep);
					acted = true;
				}
			};
			[(fire, heal)].forEach(function (action) {
				[(10, 20, 50)].forEach(function (range) {
					if (!acted) {
						action(range);
					}
				});
			});
			if (
				!acted &&
				tower.store[RESOURCE_ENERGY] > tower.store.getCapacity() / 4
			) {
				towers.push(tower);
			}
		});
		let emergency_repair = function (tower) {
			return tower.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: function (structure) {
					if (
						(structure.owner && !structure.my) ||
						![STRUCTURE_RAMPART, STRUCTURE_WALL].includes(
							structure.structureType,
						)
					) {
						// Ignore ramparts that aren't mine and everything else that isn't a wall
						return false;
					}
					return structure.hits < 10000;
				},
			});
		};
		let repair = function (tower) {
			return tower.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: function (structure) {
					if (
						(structure.owner && !structure.my) ||
						[STRUCTURE_RAMPART, STRUCTURE_WALL].includes(
							structure.structureType,
						)
					) {
						// Ignore structures owned by another player, ramparts, and walls
						return false;
					}
					return structure.hits < structure.hitsMax;
				},
			});
		};
		let bolster_defence = function (tower) {
			return tower.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: function (structure) {
					if (
						(structure.owner && !strustructure.my) ||
						![STRUCTURE_RAMPART, STRUCTURE_WALL].includes(
							structure.structureType,
						)
					) {
						// Ignore ramparts that aren't mine and everything else that isn't a wall
						return false;
					}
					return structure.hits < structure.hitsMax;
				},
			});
		};
		[emergency_repair, repair, bolster_defence].forEach(function (action) {
			let target = true;
			while (target) {
				let tower = towers.pop();
				target = action(tower);
				if (target) {
					tower.repair(target);
				} else {
					towers.push(target);
				}
			}
		});
	},
};
