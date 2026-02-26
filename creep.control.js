const role_grunt = require("role.grunt");
const role_harvester = require("role.harvester");
const role_hauler = require("role.hauler");
const role_worker = require("role.worker");

module.exports = {
	body: function (role, energy) {
		let parts = [];
		let cost = 0;
		let set_cost;
		switch (role) {
			case "grunt":
				set_cost = 60;
				if (energy >= 130) {
					parts = [ATTACK, MOVE];
					cost = 130;
					while (energy - cost >= set_cost) {
						parts = [TOUGH].concat(parts, [MOVE]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "harvester":
				set_cost = 100;
				if (energy >= set_cost * 2) {
					parts = [CARRY, MOVE];
					cost = set_cost;
					while (energy - cost >= set_cost) {
						parts = [WORK].concat(parts);
						cost += set_cost;
						if (parts.length == 7) {
							// A single harvester with 5 WORK parts
							// can fully mine a source node by itself
							break;
						}
					}
				}
				break;
			case "hauler":
				set_cost = 100;
				if (energy >= set_cost) {
					while (energy - cost >= set_cost) {
						parts = [CARRY].concat(parts, [MOVE]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "medic":
				set_cost = 300;
				if (energy >= set_cost) {
					while (energy - cost >= set_cost) {
						parts = [MOVE].concat(parts, [HEAL]);
						cost += set_cost;
						if (parts.length == 50) {
							break;
						}
					}
				}
				break;
			case "worker":
				set_cost = 200;
				if (energy >= set_cost) {
					let work = [];
					let move = [];
					while (energy - cost >= set_cost) {
						work = work.concat([WORK]);
						parts = parts.concat([CARRY]);
						move = move.concat([MOVE]);
						cost += set_cost;
						if (parts.length == 48) {
							break;
						}
					}
					parts = work.concat(parts, move);
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
					case "grunt":
						role_grunt.run(creep);
						break;
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
		let hostiles = room.find(FIND_HOSTILE_CREEPS).length;
		return [
			{
				name: "grunt",
				max: hostiles * 4,
			},
			{
				name: "harvester",
				max: source_count,
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
