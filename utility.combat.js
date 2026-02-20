function weigh_targets(hostiles) {
	let max_weight = 0;
	let target = null;
	hostiles.forEach(function (hostile) {
		let weight = 0;
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
		// Health weight: +50% for nearly dead, -50% for full health
		weight *= 0.5 + (1 - hostile.hits / hostile.hitsMax);
		// Range weight: +50% for point blank, -50% for max range
        weight *= 0.5 + (1 - pos.getRangeTo(hostile) / range);
        if (weight > max_weight) {
            target = hostile
        }
    });
    return target
}

module.exports = {
    ranged_target: function (pos, range = 50) {
        let hostiles = pos.findInRange(FIND_HOSTILE_CREEPS, range);
        return weigh_targets(hostiles)
    },
};
