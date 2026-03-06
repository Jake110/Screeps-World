let structure_names = ["containers", "extensions", "spawns", "towers", "walls"];

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
		positions = [];
		this.structure_names.forEach(function (name) {
			positions = positions.concat(room.memory[name]);
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
	},
	coord_to_pos: coord_to_pos,
	pos_to_coord: pos_to_coord,
	set_up: function (room) {
		let spawns = room.find(FIND_MY_SPAWNS);
		let room_memory = room.memory;
		if (spawns.length > 0) {
			if (!room_memory.core) {
				room_memory.core = pos_to_coord(spawns[0].pos);
			}
			this.tracker_names.forEach(function (name) {
				if (!room_memory[name]) {
					set_up_list(room, [name]);
				}
			});
			spawns.forEach(function (spawn) {
				let coord = pos_to_coord(spawn.pos);
				if (!room_memory.spawns.includes(coord)) {
					room_memory.spawns.push(coord);
				}
			});
			["roads", "tunnels"].forEach(function (mode) {
				if (!room_memory.source_connections.includes(mode)) {
					set_up_list(room, ["source_connections", mode]);
				}
			});
		}
	},
	set_up_list: set_up_list,
	structure_names: structure_names,
	tracker_names: structure_names.concat([
		"ramparts",
		"roads",
		"source_connections",
		"tunnels",
	]),
};
