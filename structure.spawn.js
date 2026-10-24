const builder = require("structure.builder");
const combat = require("utility.combat");
const creeper = require("creep.control");
const harvester = require("creep.harvest");
const memory = require("utility.memory");
const scout = require("creep.scout");
const spawn_util = require("utility.spawn");

function saved_spawn(creep, mode) {
	let spawn_coord = creep.memory[mode].split("_");
	let spawn = memory
		.coord_to_pos(spawn_coord[1], Game.rooms[spawn_coord[0]])
		.lookFor(LOOK_STRUCTURES)[0];
	try {
		if (spawn.structureType == STRUCTURE_SPAWN) {
			return spawn;
		}
	} catch {
		return null;
	}
	return null;
}

module.exports = {
	main: function (room) {
		// Get Creep Roles
		let roles = creeper.roles(room);

		// Get Extension Energy
		let extension_energy = 0;
		room.find(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return structure.structureType == STRUCTURE_EXTENSION;
			},
		}).forEach(function (extension) {
			extension_energy += extension.store[RESOURCE_ENERGY];
		});

		let core_spawn = memory
			.coord_to_pos(room.memory.core, room)
			.lookFor(LOOK_STRUCTURES)[0];

		// Ensure the room is mapped
		let room_map = Memory.map[room.name];
		if (
			room_map.status == "pending" ||
			room_map.last_checked < Game.time - 400
		) {
			memory.map_room(core_spawn);
		}

		// Spawn Creeps
		let used_spawners = [];
		if (Game.time % 11 == 0) {
			roles.forEach(function (role) {
				let creeps = room.find(FIND_MY_CREEPS, {
					filter: function (creep) {
						return (
							creep.memory.role == role.name &&
							!creep.memory.recycle
						);
					},
				});
				let multi_room_roles = ["guard", "medic", "remote", "scout"];
				if (multi_room_roles.indexOf(role.name) != -1) {
					for (let creep_name in Game.creeps) {
						let creep = Game.creeps[creep_name];
						if (
							creep.memory.role != role.name ||
							creep.memory.home != room.name
						) {
							continue;
						}
						if (creeps.indexOf(creep) == -1) {
							creeps.push(creep);
						}
					}
				}
				while (creeps.length - role.max > 0) {
					let creep;
					let timer = 10000;
					creeps.forEach(function (_creep) {
						if (_creep.ticksToLive < timer) {
							creep = _creep;
							timer = _creep.ticksToLive;
						}
					});
					let spawn_coord = [];
					if (creep.room.name == room.name) {
						spawn_coord = spawn_util.get_spawn_coord(
							room,
							creep.pos,
						);
					} else {
						spawn_coord = spawn_util.get_spawn_coord(
							Game.rooms[creep],
						);
					}
					console.log(
						"Recycling unnneeded [" +
							role.name +
							"] creep [" +
							creep.name +
							"] at [" +
							spawn_coord +
							"]",
					);
					creep.memory.recycle = spawn_coord;
					creeps = creeps.filter(function (_creep) {
						return _creep !== creep;
					});
				}
				let role_count = creeps.length;
				room.find(FIND_MY_SPAWNS, {
					filter: function (spawner) {
						return spawner.spawning;
					},
				}).forEach(function (spawner) {
					if (
						Game.creeps[spawner.spawning.name].memory.role ==
						role.name
					) {
						role_count++;
					}
				});
				let role_additions = 0;
				while (role_count + role_additions < role.max) {
					let spawn = spawn_util.get_spawn(room, null, used_spawners);
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
					let dry_run = spawn.spawnCreep(creep.parts, "TestSpawn", {
						dryRun: true,
					});
					if (dry_run != OK) {
						return null;
					}
					let new_name = role.name + Game.time;
					role_additions++;
					console.log(
						room.name +
							" - Spawning " +
							role.name +
							" " +
							(role_count + role_additions) +
							"/" +
							role.max +
							": " +
							new_name,
					);
					extension_energy +=
						spawn.store[RESOURCE_ENERGY] - creep.cost;
					creep_memory = {
						home: room.name,
						recycle: false,
						renew: false,
						role: role.name,
					};
					if (["guard", "medic"].includes(role.name)) {
						creep_memory.stand_down_in = combat.stand_down_in;
						if (role.name == "guard") {
							creep_memory.active_defence = false;
						}
					} else {
						creep_memory.full = false;
					}
					spawn.spawnCreep(creep.parts, new_name, {
						memory: creep_memory,
					});
					used_spawners.push(spawn.id);
				}
			});
		}

		// Road Construction
		if (Game.time % 13 == 0) {
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
			if (unfinished_road == 0 && core_spawn) {
				let mode = "roads";
				if (room.controller.level > 4) {
					mode = "tunnels";
				}
				builder.place_controller_road(core_spawn, mode);
				builder.place_source_roads(core_spawn, mode);
			}
		}

		// Extension Construction
		if (
			Game.time % 17 == 0 &&
			room.memory.source_connections.roads.length > 0 &&
			core_spawn
		) {
			builder.place_extensions(core_spawn);
		}

		spawns = room.find(FIND_MY_SPAWNS);

		// Per Spawn Section
		spawns.forEach(function (spawn) {
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
		});

		// Renew & Recycle Creeps
		room.find(FIND_MY_CREEPS).forEach(function (creep) {
			if (Game.time % 7 == 0) {
				let role = creep.memory.role;
				let creep_body = [];
				creep.body.forEach(function (part) {
					creep_body.push(part.type);
				});
				let spawn = spawn_util.get_spawn(
					room,
					creep.pos,
					used_spawners,
				);
				if (spawn && !creep.memory.recycle) {
					let spawn_body = creeper.body(
						role,
						spawn.store[RESOURCE_ENERGY] + extension_energy,
					).parts;
					let dry_run = spawn.spawnCreep(spawn_body, "TestSpawn", {
						dryRun: true,
					});
					if (
						dry_run == OK &&
						creep_body.join("-") != spawn_body.join("-") &&
						spawn_body.length >= creep_body.length
					) {
						console.log(
							room.name +
								" - Recycling " +
								role +
								": " +
								creep.name,
						);
						let spawn_coord = spawn_util.get_spawn_coord(
							spawn.room,
							null,
							null,
							spawn,
						);
						console.log(
							"Recycling obsolete [" +
								role.name +
								"] creep [" +
								creep.name +
								"] at [" +
								spawn_coord +
								"]",
						);
						creep.memory.recycle = spawn_coord;
						if (role == "harvester") {
							harvester.reset_target(creep);
						}
					}
				}
				if (
					creep.ticksToLive < 200 &&
					!creep_body.includes(CLAIM) &&
					!creep.memory.recycle
				) {
					// If a creep has less than 200 ticks left
					// and doesn't have a CLAIM part, trigger renew process
					let nearest_spawn = spawn_util.get_spawn_coord(
						room,
						creep.pos,
						used_spawners,
					);
					if (nearest_spawn) {
						creep.memory.renew = nearest_spawn;
						if (creep.memory.role == "harvester") {
							harvester.reset_target(creep);
						}
					}
				}
			}
			if (creep.memory.recycle || creep.memory.renew) {
				let mode = "renew";
				if (creep.memory.recycle) {
					mode = "recycle";
				}
				let _spawn = saved_spawn(creep, mode);
				if (!_spawn || _spawn.spawning) {
					_spawn = spawn_util.get_spawn(
						Game.rooms[creep.memory[mode].split("_")[0]],
						creep.pos,
						used_spawners,
					);
				}
				if (_spawn) {
					if (creep.room == _spawn.room) {
						let result = null;
						if (mode == "recycle") {
							result = _spawn.recycleCreep(creep);
						} else {
							result = _spawn.renewCreep(creep);
						}
						if (result == ERR_NOT_IN_RANGE) {
							creep.moveTo(_spawn, {
								visualizePathStyle: { stroke: "#000000" },
							});
						} else if (result == ERR_NOT_ENOUGH_ENERGY) {
							// will only trigger for renew
							if (
								creep.transfer(_spawn, RESOURCE_ENERGY) ==
								ERR_NOT_ENOUGH_RESOURCES
							) {
								creep.memory.renew = false;
							}
						}
						if (creep.ticksToLive >= 1300) {
							creep.memory.renew = false;
						}
					} else {
						scout.travel(_spawn.room.name, creep, true);
					}
				} else {
					// The spawn no longer exists, reset
					creep.memory.recycle = false;
					creep.memory.renew = false;
				}
			}
		});
	},
};
