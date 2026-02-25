const role_harvester = require("role.harvester");
const role_hauler = require("role.hauler");
const role_worker = require("role.worker");

module.exports = {
	body: function (role, energy) {
		let parts = [];
		let cost = 0;
		switch (role) {
			case "harvester":
				if (energy >= 200) {
					parts = [CARRY, MOVE];
					cost = 100;
					while (energy - cost >= 100) {
						parts = [WORK].concat(parts);
						cost += 100;
						if (parts.length == 7) {
							break;
						}
					}
				}
				break;
			case "hauler":
				if (energy >= 100) {
					let part_set = 0;
					while (energy - cost >= 100) {
						part_set++;
						cost += 100;
						if (part_set == 10) {
							break;
						}
					}
					let carry = [];
					let move = [];
					for (; part_set > 0; part_set--) {
						carry = carry.concat([CARRY]);
						move = move.concat([MOVE]);
					}
					parts = carry.concat(move);
				}
				break;
			case "worker":
				if (energy >= 250) {
					let part_set = 0;
					while (energy - cost >= 250) {
						part_set++;
						cost += 250;
						if (part_set == 10) {
							break;
						}
					}
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
			let creep_memory = creep.memory;
			if (!creep_memory.recycle && !creep_memory.renew) {
				switch (creep_memory.role) {
					case "harvester":
						role_harvester.run(creep);
						break;
					case "hauler":
						role_hauler.run(creep);
						break;
					case "worker":
						role_worker.run(creep);
						break;
				}
			}
		}
	},
	roles: function (room) {
		let container_count = room.find(FIND_STRUCTURES, {
			filter: { structureType: STRUCTURE_CONTAINER },
		}).length;
		let source_count = room.find(FIND_SOURCES, {
			filter: function (_source) {
				return (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length == 0 || room.memory.towers.length > 0
				);
			},
		}).length;
		return [
			{
				name: "harvester",
				max: Math.ceil(1.5 * source_count),
			},
			{
				name: "hauler",
				max: Math.ceil(1.5 * container_count),
			},
			{
				name: "worker",
				max: 4,
			},
		];
	},
};
