const combat = require("utility.combat");

let structure_names = [
	"containers",
	"extensions",
	"links",
	"spawns",
	"towers",
	"walls",
];

function coord_to_pos(coord, room) {
	let split_coord = coord.split(":");
	return room.getPositionAt(split_coord[0], split_coord[1]);
}

function pos_to_coord(pos) {
	return pos.x + ":" + pos.y;
}

function set_up_list(room, path) {
	if (path.constructor != Array) {
		path = [path];
	}
	let position = room.memory;
	while (path.length > 0) {
		let next = path.shift();
		if (!position[next]) {
			if (path.length > 0) {
				position[next] = {};
				position = position[next];
			} else {
				position[next] = [];
			}
		} else {
			position = position[next];
		}
	}
}

module.exports = {
	build_coords: function (room) {
		let room_memory = room.memory;
		positions = [];
		if (room_memory.storage) {
			positions.push(room_memory.storage);
		}
		this.structure_names.forEach(function (name) {
			positions = positions.concat(room_memory[name]);
		});
		return positions;
	},
	build_pos: function (room) {
		let pos_list = [];
		this.build_coords(room).forEach(function (coord) {
			pos_list.push(coord_to_pos(coord, room));
		});
		return pos_list;
	},
	clear: function () {
		for (let name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
			}
		}
		for (let name in Memory.rooms) {
			if (!Game.rooms[name] && Memory.rooms[name].core) {
				delete Memory.rooms[name];
			}
		}
	},
	coord_to_pos: coord_to_pos,
	build_map: function (map, home, room_name, range) {
		if (!(room_name in map)) {
			map[room_name] = {
				last_checked: Game.time,
				status: "pending",
			};
		}
		if (range < 3 && home.memory.defend.indexOf(room_name) == -1) {
			home.memory.defend.push(room_name);
		}
		if (range < 5) {
			if (range > 1 && home.memory.expand.indexOf(room_name) == -1) {
				home.memory.expand.push(room_name);
			}
			let exits = Game.map.describeExits(room_name);
			for (let key in exits) {
				this.build_map(map, home, exits[key], range + 1);
			}
		}
	},
	map_room: function (creep, override = false) {
		if (!override) {
			console.log("Room: " + creep.room.name);
			console.log("Route length: " + creep.memory.route.length);
			console.log("Next room: " + creep.memory.route[0].room);
			try {
				if (creep.room.name != creep.memory.route[0].room) {
					// only trigger on the first tick in a new room
					return null;
				}
			} catch {
				return null;
			}
		}
		let map = Memory.map[creep.room.name];
		if (map == null) {
			map = {
				status: "pending",
			};
		}
		console.log("Mapping room: " + creep.room.name);
		if (map.status == "pending") {
			let sources = creep.room.find(FIND_SOURCES);
			if (sources.length > 0) {
				map.sources = [];
				sources.forEach(function (source) {
					map.sources.push(pos_to_coord(source.pos));
				});
			}
			let minerals = creep.room.find(FIND_MINERALS);
			if (minerals.length > 0) {
				map.mineral = {
					type: minerals[0].mineralType,
					coord: pos_to_coord(minerals[0].pos),
				};
			}
		}
		let controller = creep.room.controller;
		let owned = false;
		if (controller) {
			if (controller.level > 0) {
				owned = true;
			}
		}
		if (owned) {
			map.status = controller.my ? "mine" : "enemy";
		} else if (combat.safe_check(creep, 50)) {
			if (combat.rival_check(creep, 50)) {
				map.status == "rival";
			} else {
				map.status = "explored";
			}
		} else {
			map.status = "hostile";
		}
		map.last_checked = Game.time;
		if (!Memory.map[creep.room.name]) {
			Memory.map[creep.room.name] = map;
		}
	},
	pos_to_coord: pos_to_coord,
	set_up: function (room) {
		let spawns = room.find(FIND_MY_SPAWNS);
		if (spawns.length > 0) {
			if (!room.memory.core) {
				room.memory.core = pos_to_coord(spawns[0].pos);
			}
			if (!room.memory.defend) {
				room.memory.defend = [];
				room.memory.expand = [];
				this.build_map(Memory.map, room, room.name, 0);
			}
			this.tracker_names.forEach(function (name) {
				if (!room.memory[name]) {
					set_up_list(room, [name]);
				}
			});
			spawns.forEach(function (spawn) {
				let coord = pos_to_coord(spawn.pos);
				if (!room.memory.spawns.includes(coord)) {
					room.memory.spawns.push(coord);
				}
			});
			if (!room.memory.source_connections) {
				["roads", "tunnels"].forEach(function (mode) {
					set_up_list(room, ["source_connections", mode]);
				});
			}
		}
	},
	set_up_list: set_up_list,
	structure_names: structure_names,
	tracker_names: structure_names.concat(["ramparts", "remotes", "roads"]),
};
