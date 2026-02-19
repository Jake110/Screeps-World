var builder = require("utility.builder");
var memory = require("utility.memory");
var role_builder = require("role.builder");
var role_harvester = require("role.harvester");
var role_upgrader = require("role.upgrader");

module.exports.loop = function () {
	// Memory cleanup
	memory.clear();

	// Creep control
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

	// Loop through all rooms
	for (let name in Game.rooms) {
		let room = Game.rooms[name];

		// Determine creep count
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

		// Memory variables
		memory.set_up(room.name);

		towers = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER },
		});
		spawns = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_SPAWN },
		});

		// Tower control
		towers.forEach(function (tower) {
			let damaged_structure = tower.pos.findClosestByRange(
				FIND_STRUCTURES,
				{
					filter: (structure) => structure.hits < structure.hitsMax,
				},
			);
			if (damaged_structure) {
				tower.repair(damaged_structure);
			}

			let closest_hostile =
				tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
			if (closest_hostile) {
				tower.attack(closest_hostile);
			}
		});

		// Tower Construction
		builder.place_towers(room);

		spawns.forEach(function (spawn) {
			// Extension Construction
			builder.place_extensions(room, spawn);

			// Spawn new creeps
			if (spawn.spawning) {
				let spawning_creep = Game.creeps[spawn.spawning.name];
				spawn.room.visual.text(
					"🛠️" + spawning_creep.memory.role,
					spawn.pos.x,
					spawn.pos.y + 1,
					{ opacity: 0.8 },
				);
			} else if (
				spawn.spawnCreep([WORK, CARRY, MOVE], "Test", {
					dryRun: true,
				}) == OK
			) {
				for (let n in roles) {
					let role = roles[n];
					let role_cap = role.name;
					role_cap[0] = role_cap[0].toUpperCase();
					let max = role.count;

					let role_creeps = _.filter(
						Game.creeps,
						(creep) => creep.memory.role == role.name,
					);

					if (role_creeps.length < max) {
						console.log(
							role_cap +
								" count: " +
								role_creeps.length +
								"/" +
								max,
						);
						let new_name = role_cap + Game.time;
						console.log(
							"Spawning new " + role.name + ": " + new_name,
						);
						spawn.spawnCreep([WORK, CARRY, MOVE], new_name, {
							memory: { role: role.name },
						});
						break;
					}
				}
			}

			// Road Consruction
			// Get a count for how many unfinished roads there are
			let unfinished_road = builder.create_construction_sites(
				room,
				"roads",
				STRUCTURE_ROAD,
			);
			// If all roads have been built, map the next batch
			if (unfinished_road == 0) {
				builder.place_source_roads(spawn);
			}
		});
	}
};
