const builder = require("structure.builder");
const creeper = require("creep.control");
const memory = require("utility.memory");

function get_spawn(room, used_spawners, recycle_check = false) {
	let spawn = null;
	let energy = -1;
	room.find(FIND_MY_STRUCTURES, {
		filter: function (structure) {
			return (
				structure.structureType == STRUCTURE_SPAWN &&
				!structure.spawning &&
				(!recycle_check ||
					recycle_check != structure.memory.recycling) &&
				!used_spawners.includes(structure.id)
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
		let used_spawners = [];
		if (Game.time % 7 == 0) {
			roles.forEach(function (role) {
				let role_count = room.find(FIND_MY_CREEPS, {
					filter: function (creep) {
						return creep.memory.role == role.name;
					},
				}).length;
				let role_additions = 0;
				while (role_count + role_additions < role.max) {
					let spawn = get_spawn(room, used_spawners);
					if (!spawn) {
						// No spawn was available
						return null;
					}
					let creep = creeper.body(
						role.name,
						spawn.store[RESOURCE_ENERGY] + extension_energy,
					);
					if (creep.cost == 0) {
						// Not enough energy for this roles cheapest creep
						return null;
					}
					let new_name = role.name + Game.time;
					console.log(
						room.name +
							" - Spawning " +
							role.name +
							" " +
							role_count +
							"/" +
							role.max +
							": " +
							new_name,
					);
					extension_energy +=
						spawn.store[RESOURCE_ENERGY] - creep.cost;
					spawn.spawnCreep(creep.parts, new_name, {
						memory: {
							recycle: false,
							renew: false,
							role: role.name,
						},
					});
					used_spawners.push(spawn.id);
					role_additions++;
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
				builder.place_extensions(spawn);
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
				console.log("Spawn Construction")
				// Get a count for how many unfinished roads there are
				builder.create_construction_sites(
					room,
					"containers",
					STRUCTURE_CONTAINER,
				);
				let unfinished_road = builder.create_construction_sites(
					room,
					"roads",
					STRUCTURE_ROAD,
				);
				// If all roads have been built, map the next batch
				if (unfinished_road == 0) {
					let spawn_memory_path = [
						spawn.room.name,
						"spawners",
						memory.pos_to_coord(spawn.pos),
					];
					memory.set_up_list(spawn_memory_path.concat("roads"));
					memory.set_up_list(spawn_memory_path.concat("tunnels"));
					let mode = "roads";
					if (spawn.room.controller.level > 4) {
						mode = "tunnels";
					}
					builder.place_controller_road(spawn, mode);
					builder.place_source_roads(spawn, mode);
				}
			}
		});

		// Renew & Recycle Creeps
		let spawn = get_spawn(room, used_spawners, true);
		room.find(FIND_MY_CREEPS).forEach(function (creep) {
			if (Game.time % 11 == 0) {
				console.log("Creep recycle / renew check")
				let role = creep.memory.role;
				let creep_body = [];
				creep.body.forEach(function (part) {
					creep_body.push(part.type);
				});
				if (spawn) {
					let spawn_body = creeper.body(
						role,
						spawn.store[RESOURCE_ENERGY] + extension_energy,
					).parts;
					if (
						creep_body.join("-") != spawn_body.join("-") &&
						spawn_body.length > creep_body.length &&
						!spawn.memory.recycling
					) {
						console.log(
							room.name +
								" - Recycling " +
								role +
								": " +
								creep.name,
						);
						creep.memory.recycle = memory.pos_to_coord(spawn.pos);
						spawn.memory.recycling = creep.name;
						spawn = get_spawn(room, used_spawners, true);
					}
				}
				if (creep.ticksToLive < 200 && !creep_body.includes(CLAIM)) {
					// If a creep has less than 200 ticks left
					// and doesn't have a CLAIM part, trigger renew process
					let nearest_spawn =
						creep.pos.findClosestByPath(FIND_MY_SPAWNS);
					if (nearest_spawn) {
						creep.memory.renew = memory.pos_to_coord(
							nearest_spawn.pos,
						);
					}
				}
			}
			if (creep.memory.recycle) {
				let structures = memory
					.coord_to_pos(creep.memory.recycle, room)
					.lookFor(LOOK_STRUCTURES);
				let _spawn;
				structures.forEach(function (structure) {
					if (structure.structureType == STRUCTURE_SPAWN) {
						_spawn = structure;
					}
				});
				if (_spawn) {
					let result = _spawn.recycleCreep(creep);
					if (result == ERR_NOT_IN_RANGE) {
						creep.moveTo(_spawn, {
							visualizePathStyle: { stroke: "#000000" },
						});
					} else if (result == OK) {
						_spawn.memory.recycling = false;
					}
				} else {
					// The spawn no longer exists, reset recycle
					creep.memory.recycle = false;
				}
			}
			if (creep.memory.renew) {
				let structures = memory
					.coord_to_pos(creep.memory.renew, room)
					.lookFor(LOOK_STRUCTURES);
				let _spawn;
				structures.forEach(function (structure) {
					if (structure.structureType == STRUCTURE_SPAWN) {
						_spawn = structure;
					}
				});
				if (_spawn) {
					if (_spawn.renewCreep(creep) == ERR_NOT_IN_RANGE) {
						creep.moveTo(_spawn, {
							visualizePathStyle: { stroke: "#000000" },
						});
					}
					if (creep.ticksToLive >= 1300) {
						creep.memory.renew = false;
					}
				} else {
					// The spawn no longer exists, reset renew
					creep.memory.renew = false;
				}
			}
		});
	},
};
