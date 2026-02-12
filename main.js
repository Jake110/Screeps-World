var harvest = require("utility.harvest");
var role_builder = require("role.builder");
var role_harvester = require("role.harvester");
var role_upgrader = require("role.upgrader");

var roles = [
	{
		name: "builder",
		count: 6,
	},
	{
		name: "harvester",
		count: 1,
	},
	{
		name: "upgrader",
		count: 1,
	},
];
var spawn = Game.spawns["Spawn1"];

function build_road(_source, target) {
	console.log(
		"Building Road From [" +
			_source.pos.x +
			", " +
			_source.pos.y +
			"] to [" +
			target.pos.x +
			", " +
			target.pos.y +
			"]",
	);
	steps = _source.pos.findPathTo(target, {
		ignoreCreeps: true,
		swampCost: 1,
	});
	for (let n in steps) {
		step = steps[n];
		console.log(step);
		console.log(typeof step);
		console.log("\t\tStep: [" + step.x + ", " + step.y + "]");
		_source.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
	}
}

module.exports.loop = function () {
	// Memory cleanup
	for (let name in Memory.creeps) {
		if (!Game.creeps[name]) {
			delete Memory.creeps[name];
			console.log("Clearing non-existing creep memory:", name);
		}
	}

	// Spawn new creeps
	for (let n in roles) {
		if (
			spawn.spawnCreep([WORK, CARRY, MOVE], "Test", {
				dryRun: true,
			}) != OK
		) {
			break;
		}
		let role = roles[n];
		let role_cap = role.name;
		role_cap[0] = role_cap[0].toUpperCase();
		let max = role.count;

		let role_creeps = _.filter(
			Game.creeps,
			(creep) => creep.memory.role == role.name,
		);

		if (role_creeps.length < max) {
			console.log(role_cap + " count: " + role_creeps.length + "/" + max);
			let new_name = role_cap + Game.time;
			console.log("Spawning new " + role.name + ": " + new_name);
			spawn.spawnCreep([WORK, CARRY, MOVE], new_name, {
				memory: { role: role.name },
			});
		}

		if (spawn.spawning) {
			let spawning_creep = Game.creeps[spawn.spawning.name];
			spawn.room.visual.text(
				"🛠️" + spawning_creep.memory.role,
				spawn.pos.x + 1,
				spawn.pos.y,
				{ align: "left", opacity: 0.8 },
			);
		}
	}

	// Tower control
	let tower = Game.getObjectById("c892c3d7f0ca9bd30c8f2c8d");
	if (tower) {
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

	// Consruction
	_source = harvest.pick(spawn);
	if (_source) {
		// Build roads between source and Spawn/Controller
		build_road(_source, spawn);
		build_road(_source, _source.room.controller);
	}
};
