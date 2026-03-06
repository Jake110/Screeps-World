const builder = require("structure.builder");
const creep = require("creep.control");
const memory = require("utility.memory");
const spawn = require("structure.spawn");
const tower = require("structure.tower");

module.exports.loop = function () {
	//console.log("<-----| Tick [" + Game.time + "] |----->");
	// Memory Cleanup
	memory.clear();

	// Creep Control
	creep.main();

	// Loop Through Rooms
	for (let name in Game.rooms) {
		let room = Game.rooms[name];

		if (!room.memory.core && room.find(FIND_MY_SPAWNS).length == 0) {
			// Skip rooms we don't have colonies in
			continue;
		}

		// Setup Room Memory
		memory.set_up(room);

		// Tower Control
		tower.fire(room);

		// Spawn Control
		spawn.main(room);

		// Active Defence Check
		creep.active_defence_check(room);

		// Construction
		builder.place_towers(room);
		builder.place_walls(room);
	}
	/*console.log(
		"CPU this tick: " + Game.cpu.getUsed() + "/" + Game.cpu.tickLimit,
	);*/
};
