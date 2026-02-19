var builder = require("structure.builder");
var memory = require("utility.memory");
var role_builder = require("role.builder");
var role_harvester = require("role.harvester");
var role_upgrader = require("role.upgrader");
var spawn = require("structure.spawn");
var tower = require("structure.tower");

module.exports.loop = function () {
	// Memory Cleanup
	memory.clear();

	// Creep Control
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

	// Loop Through Rooms
	for (let name in Game.rooms) {
		let room = Game.rooms[name];

		// Determine Creep Count
		let source_count = room.find(FIND_SOURCES).length;
		let roles = [
			{
				name: "harvester",
				count: 1,
			},
			{
				name: "builder",
				count: source_count * 2,
			},
			{
				name: "upgrader",
				count: 1,
			},
		];

		// Memory Variables
		memory.set_up(room.name);

		// Tower Control
		tower.fire(room);

		// Spawn Control
		spawn.main(room, roles);

		// Construction
		builder.place_towers(room);
	}
};
