const builder = require("structure.builder");
const creeper = require("creep.control");

function get_spawn(room, recycle_check = false) {
	let spawn = null;
	let energy = -1;
	room.find(FIND_MY_STRUCTURES, {
		filter: function (structure) {
			return (
				structure.structureType == STRUCTURE_SPAWN &&
				!structure.spawning && (!recycle_check || recycle_check != structure.memory.recycling)
			);
		},
	}).forEach(function (_spawn) {
		let spawn_energy = _spawn.store[RESOURCE_ENERGY];
		if (spawn_energy > energy) {
			spawn = _spawn;
			energy = spawn_energy;
		}
	});
	return spawn;
}

module.exports = {
	main: function (room) {
		// Get Creep Roles
		let roles = creeper.roles(room);

		// Get Extension Energy
		let extension_energy = 0;
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_EXTENSION },
		}).forEach(function (extension) {
			extension_energy += extension.store[RESOURCE_ENERGY];
		});

		// Spawn Creeps
		if (Game.time % 7 == 0) {
			roles.forEach(function (role) {
				let spawn = get_spawn(room);
				if (!spawn) {
					// No spawn was available
					return null;
				}
				let role_count = room.find(FIND_MY_CREEPS, {
					filter: function (creep) {
						return creep.memory.role == role.name;
					},
				}).length;
				if (role_count < role.max) {
					let creep = creeper.body(
						role.name,
						spawn.store[RESOURCE_ENERGY] + extension_energy,
					);
					if (creep.cost == 0) {
						// Not enough energy for this roles cheapest creep
						return null;
					}
					console.log(
						room.name +
							" - " +
							role.name +
							" count: " +
							role_count +
							"/" +
							role.max,
					);
					let new_name = role_cap + Game.time;
					console.log("Spawning new " + role.name + ": " + new_name);
					extension_energy +=
						spawn.store[RESOURCE_ENERGY] - creep.cost;
					spawn.spawnCreep(creep.parts, new_name, {
						memory: {
							recycle: false,
							renew: false,
							role: role.name,
						},
					});
					if (spawn.memory.recycling) {
						Memory.creeps[spawn.memory.recycling].recycle = false;
						spawn.memory.recycling = false;
					}
				}
			});
		}

		// Per Spawn Section
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_SPAWN },
		}).forEach(function (spawn) {
			// Extension Construction
			if (Game.time % 17 == 0) {
				builder.place_extensions(room, spawn);
			}

			// Spawning Creep Text
			if (spawn.spawning) {
				let spawning_creep = Game.creeps[spawn.spawning.name];
				spawn.room.visual.text(
					"🛠️" + spawning_creep.memory.role,
					spawn.pos.x,
					spawn.pos.y + 1,
					{ color: "#2bff00", opacity: 0.8 },
				);
			}

			// Creep Recycling Check
			if (spawn.memory.recycling) {
				if (!Game.creeps[spawn.memory.recycling]) {
					spawn.memory.recycling = false;
				}
			}

			// Road Consruction
			if (Game.time % 13 == 0) {
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
			}
		});

		// Renew & Recycle Creeps
		spawn = get_spawn(room, true)
		room.find(FIND_MY_CREEPS).forEach(function (creep) {
			if (Game.time % 11 == 0) {
				let role = creep.memory.role;
				let creep_body = [];
				creep.body.forEach(function (part) {
					creep_body.push(part.type);
				});
				if (spawn) {
					let spawn_body = creeper.body(role, energy);
					if (
						creep_body.join("-") != spawn_body.join("-") &&
						spawn_body.length > creep_body.length &&
						!spawn.memory.recycling
					) {
						console.log(room.name + " - Recycling " + role + ": " + creep.name);
						creep.memory.recycle = true;
						spawn.memory.recycling = creep.name;
					}
				}
				if (creep.ticksToLive < 200 && !creep_body.includes(CLAIM)) {
					// If a creep has less than 200 ticks left
					// and doesn't have a CLAIM part, trigger renew process
					creep.memory.renew = true;
				}
			}
			if (creep.memory.recycle) {
				let result = spawn.recycleCreep(creep);
				if (result == ERR_NOT_IN_RANGE) {
					creep.moveTo(spawn, {
						visualizePathStyle: { stroke: "#000000" },
					});
				} else if (result == OK) {
					spawn.memory.recycling = false;
				}
			}
			if (creep.memory.renew) {
				if (spawn.renewCreep(creep) == ERR_NOT_IN_RANGE) {
					creep.moveTo(spawn, {
						visualizePathStyle: { stroke: "#000000" },
					});
				}
			}
			if (creep.ticksToLive >= 1300) {
				creep.memory.renew = false;
			}
		});
	},
};
