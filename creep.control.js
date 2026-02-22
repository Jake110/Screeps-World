const role_harvester = require("role.harvester");
const role_worker = require("role.worker");

module.exports = {
	body: function (role, energy) {
		let parts = [];
		let cost = 0;
		switch (role) {
			case "harvester":
				if (energy >= 200) {
					parts = [CARRY, MOVE];
					cost = 200;
					let work = 1;
					while (energy - 200 >= 100) {
						work++;
						energy -= 100;
						if (work == 5) {
							break;
						}
					}
					for (; work > 0; work--) {
						parts = [WORK].concat(parts);
						cost += 100;
					}
				}
				break;
			case "worker":
				if (energy >= 250) {
					let part_set = 1;
					while (energy - 250 >= 250) {
						part_set++;
						energy -= 250;
					}
					cost = 250 * part_set;
					let work = [];
					let carry = [];
					let move = [];
					for (; part_set > 0; part_set--) {
						work = work.concat([WORK]);
						carry = carry.concat([CARRY]);
						move = move.concat([MOVE, MOVE]);
					}
					parts = work.concat(carry, move);
				}
				break;
		}
		return {
			parts: parts,
			cost: cost,
		};
	},
	main: function () {
		for (let name in Game.creeps) {
			let creep = Game.creeps[name];

			if (!creep.memory.recycle && !creep.memory.renew) {
				if (creep.memory.role == "harvester") {
					role_harvester.run(creep);
				}
				if (creep.memory.role == "worker") {
					role_worker.run(creep);
				}
			}
		}
	},
	roles: function (room) {
		let source_count = room.find(FIND_SOURCES, {
			filter: function (_source) {
				return (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length == 0 || Memory[room.name].towers.length > 0
				);
			},
		}).length;
		return [
			{
				name: "harvester",
				max: 2 * source_count,
			},
			{
				name: "worker",
				max: 4,
			},
		];
	},
};
