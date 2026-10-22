const builder = require("structure.builder");
const hauler = require("creep.hauler");
const worker = require("creep.worker");

function set_up_road(creep, start, end) {
	builder.place_road(creep.room, start, end, "tunnels", 0, true);
	creep.room.memory.remote_roads.push(
		creep.memory.home + "_" + creep.memory.remote,
	);
}

module.exports = {
	build_and_scavenge: function (creep) {
		if (creep.memory.full) {
			return worker.build(creep);
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
					result = creep.withdraw(target, RESOURCE_ENERGY);
				}
				hauler.capacity_check(creep, RESOURCE_ENERGY);
			}
		}
		return false;
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
	road_check: function (creep) {
		if (creep.room.name != creep.memory.route[0].room) {
			// only trigger on the first tick in a new room
			return null;
		}
		if (!creep.room.memory.remote_roads) {
			creep.room.memory.remote_roads = [];
		}
		if (!creep.room.memory.roads) {
			creep.room.memory.roads = [];
		}
		let tag = creep.memory.home + "_" + creep.memory.remote;
		if (creep.room.memory.remote_roads.indexOf(tag) != -1) {
			// road already setup
			return null;
		}
		if (creep.room.name == creep.memory.home && creep.memory.full) {
			// only when returning home when full
			if (creep.room.memory.ramparts.length == 0) {
				// only place the home road once the walls are built
				return null;
			}
			// setup road from exit to rampart
			let ramparts = [];
			creep.room.memory.ramparts.forEach(function (rampart) {
				ramparts.push(memory.coord_to_pos(rampart, creep.room));
			});
			let rampart = creep.pos.findClosestByRange(ramparts);
			set_up_road(creep, creep.pos, rampart);
			// setup road from rampart to dropoff
			let dropoff = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				ignoreCreeps: true,
				swampCost: 1,
				filter: function (structure) {
					return (
						[STRUCTURE_LINK, STRUCTURE_STORAGE].indexOf(
							structure.structureType,
						) != -1
					);
				},
			});
			set_up_road(creep, rampart, dropoff);
		} else if (creep.room.name == creep.memory.remote.split("_")[0]) {
			// only when entering target source room
			set_up_road(
				creep,
				creep.pos,
				memory.coord_to_pos(
					creep.memory.remote.split("_")[1],
					creep.room,
				),
			);
		} else if (creep.memory.full) {
			// only when entering a room on the way home
			let exit = creep.pos.findClosestByRange(creep.memory.route[1].exit);
			set_up_road(creep, creep.pos, exit);
		}
		builder.create_construction_sites(creep.room, "roads", STRUCTURE_ROAD);
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
