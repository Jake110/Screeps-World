var role_harvester = require("role.harvester");
var role_worker = require("role.worker");

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
		let source_count = room.find(FIND_SOURCES).length;
		return [
			{
				name: "harvester",
				count: Math.ceil(source_count * 0.75),
			},
			{
				name: "worker",
				count: Math.ceil(source_count * 1.5),
			},
		];
	},
};
