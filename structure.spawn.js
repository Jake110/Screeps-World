const builder = require("structure.builder");
const combat = require("utility.combat");
const creeper = require("creep.control");
const memory = require("utility.memory");

function get_spawn(room, used_spawners, recycle_check = false) {
	let spawn = null;
	let energy = -1;
	room.find(FIND_MY_SPAWNS, {
		filter: function (spawner) {
			return (
				!spawner.spawning &&
				(!recycle_check || recycle_check != spawner.memory.recycling) &&
				!used_spawners.includes(spawner.id)
			);
		},
	}).forEach(function (spawner) {
		let spawn_energy = spawner.store[RESOURCE_ENERGY];
		if (spawn_energy > energy) {
			spawn = spawner;
			energy = spawn_energy;
		}
	});
	return spawn;
}

function saved_spawn(room, creep, mode) {
	return memory
		.coord_to_pos(creep.memory[mode], room)
		.lookFor(LOOK_STRUCTURES)[0];
}

module.exports = {
	main: function (room) {
		// Get Creep Roles
		let roles = creeper.roles(room);

		console.log("-------- > Spawner code")
		// Get Extension Energy
		let extension_energy = 0;
		let extension_max = 0;
		let extension_list = []
		room.find(FIND_MY_STRUCTURES, {
			filter: function(structure){ return structure.isActive() && structure.structureType == STRUCTURE_EXTENSION },
		}).forEach(function (extension) {
			extension_list.push(extension)
			extension_energy += extension.store[RESOURCE_ENERGY];
			extension_max += extension.store.getCapacity(RESOURCE_ENERGY);
		});
		console.log("Current Energy: " + extension_energy)
		console.log("Max Energy: "+extension_max)

		let core_spawn = memory
					.coord_to_pos(room.memory.core, room)
								.lookFor(LOOK_STRUCTURES)[0];


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
					console.log("--| Role: "+role.name)
					let spawn = get_spawn(room, used_spawners);
					if (!spawn) {
						// No spawn was available
						return null;
					}
					let creep = null;
					if (
						role_count + role_additions == 0 &&
						["harvester", "worker"].includes(role.name)
					) {
						creep = creeper.body(
							role.name,
							spawn.store[RESOURCE_ENERGY] + extension_energy,
						);
					} else {
						creep = creeper.body(
							role.name,
							spawn.store.getCapacity(RESOURCE_ENERGY) +
								extension_max,
						);
					}
					if (creep.cost == 0) {
						// Not enough energy for this roles cheapest creep
						return null;
					}
					let dry_run = spawn.spawnCreep(creep.parts, "TestSpawn", {dryRun:true, energyStructures:extension_list.concat([spawn])})
					console.log("Dry run result: " + dry_run)
					if (dry_run != OK) {
						console.log("Cost: "+creep.cost)
						console.log("Body: "+creep.parts)
						console.log("Energy: "+(spawn.store[RESOURCE_ENERGY]+extension_energy))
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
					if (["grunt", "medic"].includes(role.name)) {
						creep_memory.stand_down_in = combat.stand_down_in;
						if (role.name == "grunt") {
							creep_memory.active_defence = false;
						}
					} else {
						creep_memory.full = false;
					}
					energy_sources = [spawn]
					energy_pos = [spawn.pos]
					energy_pool = spawn.store[RESOURCE_ENERGY]
					while (energy_pool < creep.cost) {
						let extension = core_spawn.pos.findClosestByPath(FIND_MY_STRUCTURES, {
							filter: function (structure) {
							return structure.isActive() && structure.structureType == STRUCTURE_EXTENSION && !energy_sources.includes(structure)
							}
						})
						if (extension) {
							energy_sources.push(extension)
							energy_pos.push(extension.pos)
							energy_pool+= extension.store[RESOURCE_ENERGY]
						} else {
							break
						}
					}
					console.log("Creep cost: " + creep.cost)
					console.log("Energy Pool: " + energy_pool)
					console.log("Energy Sources: " + energy_pos)
					let result = spawn.spawnCreep(creep.parts, new_name, {
						energyStructures: energy_sources,
						memory: creep_memory,
					});
					console.log("----| Spawn result: " + result)
					if (result == ERR_NOT_ENOUGH_ENERGY) {
						console.log("Cost: "+creep.cost)
						console.log("Body: "+creep.parts)
					}
					used_spawners.push(spawn.id);
					if (spawn.memory.recycling) {
						Memory.creeps[spawn.memory.recycling].recycle = false;
						spawn.memory.recycling = false;
					}
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
			if (unfinished_road == 0) {
				let mode = "roads";
				if (room.controller.level > 4) {
					mode = "tunnels";
				}
				builder.place_controller_road(core_spawn, mode);
				builder.place_source_roads(core_spawn, mode);
			}
		}

		// Extension Construction
		if (Game.time % 17 == 0) {
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

			// Creep Recycling Check
			if (spawn.memory.recycling) {
				if (!Game.creeps[spawn.memory.recycling]) {
					spawn.memory.recycling = false;
				}
			}
		});

		// Renew & Recycle Creeps
		let spawn = get_spawn(room, used_spawners, true);
		room.find(FIND_MY_CREEPS).forEach(function (creep) {
			if (Game.time % 7 == 0) {
				let role = creep.memory.role;
				let creep_body = [];
				creep.body.forEach(function (part) {
					creep_body.push(part.type);
				});
				if (spawn) {
					let spawn_body = creeper.body(
						role,
						spawn.store.getCapacity(RESOURCE_ENERGY) +
							extension_max,
					).parts;
					if (
						spawn_body.cost <=
						spawn.store[RESOURCE_ENERGY] + extension_energy
					) {
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
							creep.memory.recycle = memory.pos_to_coord(
								spawn.pos,
							);
							spawn.memory.recycling = creep.name;
							spawn = get_spawn(room, used_spawners, true);
						}
					}
				}
				if (creep.ticksToLive < 200 && !creep_body.includes(CLAIM)) {
					// If a creep has less than 200 ticks left
					// and doesn't have a CLAIM part, trigger renew process
					let nearest_spawn = creep.pos.findClosestByPath(spawns);
					if (nearest_spawn) {
						creep.memory.renew = memory.pos_to_coord(
							nearest_spawn.pos,
						);
					}
				}
			}
			if (creep.memory.recycle) {
				let _spawn = saved_spawn(room, creep, "recycle");
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
				let _spawn = saved_spawn(room, creep, "renew");
				if (_spawn) {
					let result = _spawn.renewCreep(creep);
					if (result == ERR_NOT_IN_RANGE) {
						creep.moveTo(_spawn, {
							visualizePathStyle: { stroke: "#000000" },
						});
					} else if (result == ERR_NOT_ENOUGH_ENERGY) {
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
					// The spawn no longer exists, reset renew
					creep.memory.renew = false;
				}
			}
		});
	},
};
