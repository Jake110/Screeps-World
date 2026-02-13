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

	// Get all Towers and Spawns
	let towers = [];
	let spawns = [];
	for (let name in Game.rooms) {
		console.log("Scanning Room: " + name);
		let room = Game.rooms[name];
		towers.push.apply(
			room.find(FIND_MY_STRUCTURES, {
				filter: { structureType: STRUCTURE_TOWER },
			}),
		);
		spawns.push.apply(
			room.find(FIND_MY_STRUCTURES, {
				filter: { structureType: STRUCTURE_SPAWN },
			}),
		);
	}
	console.log("Towers: " + towers.length);
	console.log("Spawns: " + spawns.length);

	// Tower control
	towers.forEach(function (tower) {
		let damaged_structure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
			filter: (structure) => structure.hits < structure.hitsMax,
		});
		if (damaged_structure) {
			tower.repair(damaged_structure);
		}

		let closest_hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if (closest_hostile) {
			tower.attack(closest_hostile);
		}
	});

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

	spawns.forEach(function (spawn) {
		// Spawn new creeps
		if (spawn.spawning) {
			let spawning_creep = Game.creeps[spawn.spawning.name];
			spawn.room.visual.text(
				"🛠️" + spawning_creep.memory.role,
				spawn.pos.x + 1,
				spawn.pos.y,
				{ align: "left", opacity: 0.8 },
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
						role_cap + " count: " + role_creeps.length + "/" + max,
					);
					let new_name = role_cap + Game.time;
					console.log("Spawning new " + role.name + ": " + new_name);
					spawn.spawnCreep([WORK, CARRY, MOVE], new_name, {
						memory: { role: role.name },
					});
					break;
				}
			}
		}

		// Consruction
		if (spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
			builder.build_roads(spawn);
		}
	});
};
