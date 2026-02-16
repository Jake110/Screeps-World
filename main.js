var builder = require("utility.builder");
var role_builder = require("role.builder");
var role_harvester = require("role.harvester");
var role_upgrader = require("role.upgrader");

var roles = [
	{
		name: "harvester",
		count: 1,
	},
	{
		name: "builder",
		count: 4,
	},
	{
		name: "upgrader",
		count: 1,
	},
];

module.exports.loop = function () {
	// Memory cleanup
	for (let name in Memory.creeps) {
		if (!Game.creeps[name]) {
			delete Memory.creeps[name];
			console.log("Clearing non-existing creep memory:", name);
		}
	}

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
		builder.build_towers(room);

		spawns.forEach(function (spawn) {
			// Spawn new creeps
			if (spawn.spawning) {
				let spawning_creep = Game.creeps[spawn.spawning.name];
				spawn.room.visual.text(
					"🛠️" + spawning_creep.memory.role,
					spawn.pos.x + 1,
					spawn.pos.y,
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
			// Get a count for how many road flags do not have road on them
			road_flags_unfinished = room.find(FIND_FLAGS, {
				filter: function (flag) {
					// If the flag isn't for roads, ignore it
					if (
						flag.color !== COLOR_BROWN ||
						flag.secondaryColor !== COLOR_WHITE
					) {
						return false;
					}
					// Ignore road flags which have roads built already
					return _.every(flag.pos.look(), function (item) {
						if (item.type === FIND_STRUCTURES) {
							return item.structureType !== STRUCTURE_ROAD;
						}
						return true;
					});
				},
			}).length;
			if (road_flags_unfinished == 0) {
				builder.place_source_roads(spawn);
			}
		});
	}
};
