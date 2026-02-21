const builder = require("structure.builder");
const creep = require("creep.control");
const memory = require("utility.memory");
const spawn = require("structure.spawn");
const tower = require("structure.tower");

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
