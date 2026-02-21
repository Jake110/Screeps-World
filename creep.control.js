const role_harvester = require("role.harvester");
const role_worker = require("role.worker");

module.exports = {
	body: function (role, energy) {
		if (role == "harvester") {
			role = "worker";
		}
		switch (true) {
			case energy >= 800:
				return [
					WORK,
					WORK,
					WORK,
					CARRY,
					CARRY,
					CARRY,
					MOVE,
					MOVE,
					MOVE,
					MOVE,
					MOVE,
					MOVE,
				];
			case energy >= 500:
				return [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
			case energy >= 250:
				return [WORK, CARRY, MOVE, MOVE];
		}
		return [];
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
				count: 2 * source_count,
			},
			{
				name: "worker",
				count: 4,
			},
		];
	},
};
