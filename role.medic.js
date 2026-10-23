const scout = require("creep.scout");

module.exports = {
	run: function (creep) {
		let guard_name = creep.memory.guard;
		let guard;
		if (guard_name) {
			guard = Game.creeps[guard_name];
		} else {
			let guards = [];
			let guard_names = [];
			let medics = [];
			for (let name in Game.creeps) {
				let _creep = Game.creeps[name];
				if (_creep.memory.role == "guard") {
					guards.push(_creep);
					guard_names.push(_creep.name);
				} else if (_creep.memory.role == "medic") {
					medics.push(_creep);
				}
			}
			medics.forEach(function (medic) {
				let index = guard_names.indexOf(medic.guard);
				if (index == -1) {
					guards.splice(index, 1);
					guard_names.splice(index, 1);
				}
			});
			guard = creep.pos.findClosestByPath(guards);
		}
		if (guard) {
			let target = guard;
			if (creep.hits < creep.hitsMax && guard.hits == guard.hitsMax) {
				target = creep;
			}
			if (creep.pos.findInRange(target, 1)) {
				creep.heal(target);
			} else {
				creep.rangedHeal(target);
			}
			creep.moveTo(guard);
		} else {
			scout.return(creep);
		}
	},
};
