module.exports = {
	build_and_scavenge: function (creep) {
		if (creep.memory.full) {
			worker.build(creep);
		} else {
			let target = hauler.get_collection_target(
				creep,
				[FIND_DROPPED_RESOURCES, FIND_TOMBSTONES],
				false,
				false,
				1,
			);
			if (target) {
				if (!target.store) {
					result = creep.pickup(target);
				} else {
					result = target.transfer(creep, RESOURCE_ENERGY);
				}
				hauler.capacity_check(creep, RESOURCE_ENERGY);
			}
		}
	},
	confirm_remote_source: function (creep) {
		if (!creep.memory.remote) {
			let remotes = Memory.rooms[creep.memory.home].remotes;
			for (let name in Game.creeps) {
				let _creep = Game.creeps[name];
				if (
					_creep.memory.role != "remote" ||
					_creep.memory.home != creep.memory.home ||
					!_creep.memory.remote
				) {
					continue;
				}
				remotes.splice(remotes.indexOf(_creep.memory.remote), 1);
			}
			if (remotes.length == 0) {
				// This remote creep is not needed, recycling...
				creep.memory.remote = creep.memory.home;
			} else {
				creep.memory.remote = remotes[0];
			}
		}
	},
	update_remote_list: function () {
		if (Game.time % 53 == 0) {
			let remotes = [];
			let room_names = [];
			for (let room_name in Game.rooms) {
				let room = Game.rooms[room_name];
				if (room.memory.remotes) {
					remotes = remotes.concat(room.memory.remotes);
					room_names.push(room_name);
				}
			}
			for (let room_name in Memory.map) {
				let map = Memory.map[room_name];
				if (map.sources && room_names.indexOf(room_name) == -1) {
					map.sources.forEach(function (source) {
						let coord = room_name + "_" + source;
						if (remotes.indexOf(coord) == -1) {
							let home = null;
							let route = null;
							room_names.forEach(function (name) {
								let path = Game.map.findRoute(room_name, name);
								if (path.length < 2) {
									if (
										route == null ||
										path.length < route.length
									) {
										home = name;
										route = path;
									} else if (
										path.length == route.length &&
										Memory.rooms[name].remotes.length <
											Memory.rooms[home].remotes.length
									) {
										home = name;
										route = path;
									}
								}
							});
							if (home != null) {
								Memory.rooms[home].remotes.push(coord);
							}
						}
					});
				}
			}
		}
	},
};
