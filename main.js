var builder = require("structure.builder");
var creep = require("creep.control");
var memory = require("utility.memory");
var spawn = require("structure.spawn");
var tower = require("structure.tower");

module.exports.loop = function () {
	//console.log("Tick: " + Game.time);
	// Memory Cleanup
	memory.clear();

	// Creep Control
	creep.main();

	// Loop Through Rooms
	for (let name in Game.rooms) {
		let room = Game.rooms[name];

		// Memory Variables
		memory.set_up(room.name);

		// Tower Control
		tower.fire(room);

		// Spawn Control
		spawn.main(room);

		// Construction
		builder.place_towers(room);
		/*console.log(
			"CPU this tick: " + Game.cpu.getUsed() + "/" + Game.cpu.tickLimit,
		);*/
	}
};
