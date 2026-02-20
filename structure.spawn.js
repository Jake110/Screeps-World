var builder = require("structure.builder");
var creeper = require("creep.control");

module.exports = {
	main: function (room) {
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_SPAWN },
		}).forEach(function (spawn) {
			// Extension Construction
			if (Game.time % 17 == 0) {
				builder.place_extensions(room, spawn);
			}

			// Get Creep Roles
			let roles = creeper.roles(room);

			// Get Energy Capacity
			let capacity = 300;
			room.find(FIND_MY_STRUCTURES, {
				filter: { structureType: STRUCTURE_EXTENSION },
			}).forEach(function (extension) {
				capacity += extension.store.getCapacity();
			});

			// Spawn Creeps
			if (spawn.spawning) {
				let spawning_creep = Game.creeps[spawn.spawning.name];
				spawn.room.visual.text(
					"🛠️" + spawning_creep.memory.role,
					spawn.pos.x,
					spawn.pos.y + 1,
					{ color: "#2bff00", opacity: 0.8 },
				);
			} else {
				if (Game.time % 7 == 0) {
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
							let body = creeper.body(role.name, capacity);
							if (
								spawn.spawnCreep(body, "Test", {
									dryRun: true,
								}) != OK
							) {
								// If we can't spawn the creep for this role, move on
								continue;
							}
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
							spawn.spawnCreep(body, new_name, {
								memory: {
									recycle: false,
									renew: false,
									role: role.name,
								},
							});
							break;
						}
					}
				}
			}

			// Renew Creeps
			for (let name in Game.creeps) {
				let creep = Game.creeps[name];
				if (Game.time % 11 == 0) {
					let role = creep.memory.role;
					let body = [];
					creep.body.forEach(function (part) {
						body.push(part.type);
					});
					let spawn_body = creeper.body(role, capacity);
					if (
						body.join("-") != spawn_body.join("-") &&
						spawn_body.length > body.length
					) {
						creep.memory.recycle = true;
						console.log("Recycling " + role + ": " + creep.name);
					}
					if (creep.ticksToLive < 200 && !body.includes(CLAIM)) {
						// If a creep has less than 200 ticks left
						// and doesn't have a CLAIM part, trigger renew process
						creep.memory.renew = true;
					}
				}
				if (creep.memory.recycle) {
					if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
						creep.moveTo(spawn, {
							visualizePathStyle: { stroke: "#000000" },
						});
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
	},
};
