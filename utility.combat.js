function weigh_targets(hostiles) {
	let max_weight = 0;
	let target = null;
	hostiles.forEach(function (hostile) {
		let weight = 0;
		if (hostile.body) {
			// Hostile is a Creep
			hostile.body.forEach(function (part) {
				let w;
				switch (part.type) {
					case HEAL:
						w = 30;
						break;
					case CLAIM:
						w = 25;
						break;
					case RANGED_ATTACK:
					case ATTACK:
						w = 20;
						break;
					case WORK:
						w = 15;
						break;
					case MOVE:
					case CARRY:
						w = 10;
						break;
					case TOUGH:
						w = 5;
				}
				if (part.boost != null) {
					w *= 3;
				}
				weight += w;
			});
		} else {
			// Hostile is a Tower
			weight = hostile.store[RESOURCE_ENERGY];
		}
		// Health weight: +50% for nearly dead, -50% for full health
		weight *= 0.5 + (1 - hostile.hits / hostile.hitsMax);
		// Range weight: +50% for point blank, -50% for max range
		weight *= 0.5 + (1 - pos.getRangeTo(hostile) / range);
		if (weight > max_weight) {
			target = hostile;
		}
	});
	return target;
}

module.exports = {
	avoid_filter: function (target) {
		return (
			target.pos.findInRange(FIND_HOSTILE_CREEPS, 10, {
				filter: function (object) {
					return (
						object.getActiveBodyparts(ATTACK) != 0 ||
						object.getActiveBodyparts(RANGED_ATTACK) != 0
					);
				},
			}).length == 0
		);
	},
	melee_target: function (creep) {
		let target_check = function (hostile, distance, my_stuff) {
			for (let index = 0; index < my_stuff.length; index++) {
				let mine = my_stuff[index];
				let dist = hostile.pos.findPathTo(mine).length;
				if (dist < distance) {
					return { target: hostile, distance: dist };
				}
			}
			return false;
		};
		let target;
		let distance = 999;
		creep.room.find(FIND_HOSTILE_CREEPS).forEach(function (hostile) {
			new_target = target_check(
				hostile,
				distance,
				hostile.pos.findInRange(FIND_MY_CREEPS, 15),
			);
			if (!new_target) {
				new_target = target_check(
					hostile,
					distance,
					hostile.pos.findInRange(FIND_MY_STRUCTURES, 15),
				);
			}
			if (!new_target) {
				new_target = target_check(
					hostile,
					distance,
					hostile.pos.findInRange(FIND_STRUCTURES, 15, {
						filter: { structureType: STRUCTURE_CONTAINER },
					}),
				);
			}
			if (new_target) {
				target = new_target.target;
				distance = new_target.distance;
			}
		});
		return target;
	},
	ranged_target: function (pos, range = 50) {
		let hostiles = pos.findInRange(FIND_HOSTILE_CREEPS, range);
		let towers = pos.findInRange(FIND_HOSTILE_STRUCTURES, range, {
			filter: function (structure) {
				return structure.structureType == STRUCTURE_TOWER;
			},
		});
		return weigh_targets(hostiles.concat(towers));
	},
};
