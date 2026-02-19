var builder = require("structure.builder");

module.exports = {
	main: function (room) {
		room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_SPAWN },
		}).forEach(function (spawn) {
			// Extension Construction
			builder.place_extensions(room, spawn);

			// Spawn new creeps
			if (spawn.spawning) {
				let spawning_creep = Game.creeps[spawn.spawning.name];
				spawn.room.visual.text(
					"🛠️" + spawning_creep.memory.role,
					spawn.pos.x,
					spawn.pos.y + 1,
					{ color: "#2bff00", opacity: 0.8 },
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
	},
};
