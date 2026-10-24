const memory = require("utility.memory");

module.exports = {
	get_spawn: function (room, pos = null, used_spawners = []) {
		let spawns = room.find(FIND_MY_SPAWNS, {
			filter: function (spawner) {
				return !spawner.spawning && !used_spawners.includes(spawner.id);
			},
		});
		let spawn = null;
		if (pos) {
			spawn = pos.findClosestByPath(spawns);
		} else {
			let energy = -1;
			spawns.forEach(function (spawner) {
				let spawn_energy = spawner.store[RESOURCE_ENERGY];
				if (spawn_energy > energy) {
					spawn = spawner;
					energy = spawn_energy;
				}
			});
		}
		return spawn;
	},
	get_spawn_coord: function (
		room,
		pos = null,
		used_spawners = [],
		spawn = null,
	) {
		if (!spawn) {
			spawn = this.get_spawn(room, pos, used_spawners);
		}
		if (spawn) {
			return room.name + "_" + memory.pos_to_coord(spawn.pos);
		}
		return null;
	},
};
