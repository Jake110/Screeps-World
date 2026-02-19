var role_builder = require("role.builder");
var role_harvester = require("role.harvester");
var role_upgrader = require("role.upgrader");

module.exports = {
	body: function (role, capacity) {
		if (["harvester", "builder", "upgrader"].includes(role)) {
			role = "worker";
		}
		switch (true) {
			case capacity >= 800:
				return [
					WORK,
					WORK,
					WORK,
					WORK,
					CARRY,
					CARRY,
					CARRY,
					CARRY,
					MOVE,
					MOVE,
					MOVE,
					MOVE,
				];
			case capacity >= 500:
				return [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
			case capacity >= 300:
				return [WORK, CARRY, CARRY, MOVE, MOVE];
		}
	},
	main: function () {
		for (let name in Game.creeps) {
			let creep = Game.creeps[name];
			if (creep.memory.role == "builder") {
				role_builder.run(creep);
			}
			if (creep.memory.role == "harvester") {
				role_harvester.run(creep);
			}
			if (creep.memory.role == "upgrader") {
				role_upgrader.run(creep);
			}
		}
	},
	roles: function (room) {
		let source_count = room.find(FIND_SOURCES).length;
		return [
			{
				name: "harvester",
				count: Math.ceil(source_count / 2),
			},
			{
				name: "builder",
				count: Math.ceil(source_count * 1.5),
			},
			{
				name: "upgrader",
				count: 1,
			},
		];
	},
};
