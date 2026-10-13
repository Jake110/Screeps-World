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
			for (key in exits) {
				this.build_map(map, home, exits[key], range + 1);
			}
		}
	},
	map_room: function (home, creep) {
		if (
			[0, 49].indexOf(creep.pos.x) == -1 &&
			[0, 49].indexOf(creep.pos.y) == -1 &&
			creep.memory.role
		) {
			// Only run mapping when at an exit
			return null;
		}
		let map = home.memory.map[creep.room.name];
		if (map == null) {
			map = {
				status: "pending",
			};
		}
		if (map.status == "pending") {
			if (creep.memory.role) {
				creep.memory.target = null;
				creep.memory.route = null;
			}
			let sources = creep.room.find(FIND_SOURCES);
			if (sources.length > 0) {
				map.sources = [];
				sources.forEach(function (source) {
					map.sources.push(memory.pos_to_coord(source.pos));
				});
			}
			let minerals = creep.room.find(FIND_MINERALS);
			if (minerals.length > 0) {
				map.mineral = {
					type: minerals[0].mineralType,
					coord: memory.pos_to_coord(minerals[0].pos),
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
			map.status = "owned";
		} else if (combat.safe_check(creep, 50)) {
			map.status = "explored";
		} else {
			map.status = "hostile";
		}
		map.last_checked = Game.time;
		if (!home.memory.map[creep.room.name]) {
			home.memory.map[creep.room.name] = map;
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
