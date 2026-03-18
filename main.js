const builder = require("structure.builder");
const creep = require("creep.control");
const memory = require("utility.memory");
const quartermaster = require("creep.quartermaster");
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

		// Link Control
		let links = [];
		room.memory.links.forEach(function (link_coord) {
			links.push(link_coord);
			console.log("Links found at: " + link_coord);
		});
		let core_link_coord = links.shift();
		console.log("Core Link Coord: " + core_link_coord);
		links.forEach(function (link) {
			console.log("\tChecking Link: " + link);
			if (link.cooldown == 0) {
				/*let core_link = memory
					.coord_to_pos(creep.room.memory.core, creep.room)
					.findInRange(FIND_MY_STRUCTURES, {
						filter: { structureType: STRUCTURE_LINK },
					});*/
				let core_link = quartermaster.get_structure(
					room,
					core_link_coord,
					STRUCTURE_LINK,
				);
				if (core_link) {
					console.log("Core Link: " + core_link);
					//core_link = core_link[0];
					if (
						core_link.store.getFreeCapacity(RESOURCE_ENERGY) >=
						link.store[RESOURCE_ENERGY]
					) {
						console.log("Linking energy");
						link.transferEnergy(core_link);
					}
				}
			}
		});

		// Active Defence Check
		creep.active_defence_check(room);

		// Construction
		builder.place_towers(room);
		builder.place_walls(room);
		builder.place_storage(room);
		builder.place_links(room);
	}
	/*console.log(
		"CPU this tick: " + Game.cpu.getUsed() + "/" + Game.cpu.tickLimit,
	);*/
};
