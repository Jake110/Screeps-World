/**
 * place road flags from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(room, origin, target) {
	place_road_around(room, origin);
	place_road_around(room, target);
	steps = origin.findPathTo(target, {
		ignoreCreeps: true,
		ignoreRoads: true,
		swampCost: 1,
	});
	steps.pop();
	steps.forEach(function (step) {
		save_road(room.name, step.x + ":" + step.y);
	});
}

function place_road_around(room, pos) {
	for (let n = -1; n <= 1; n++) {
		for (let m = -1; m <= 1; m++) {
			if (n == 0 && m == 0) {
				continue;
			}
			origin_adjacent = room.getPositionAt(
				pos.x + parseInt(n),
				pos.y + parseInt(m),
			);
			if (can_build_here(origin_adjacent, true)) {
				save_road(room.name, pos.x + n + ":" + (pos.y + m));
			}
		}
	}
}

function save_road(room_name, coord) {
	if (!Memory[room_name].roads.includes(coord)) {
		Memory[room_name].roads.push(coord);
	}
}

/**
 * @param {RoomPosition} pos
 * @param {boolean} respect_walls
 **/
function can_build_here(pos, respect_walls = false) {
	coord = pos.x + ":" + pos.y;
	if (
		Memory[pos.roomName].towers.includes(coord) ||
		MemMemory[pos.roomName].extensions.includes(coord)
	) {
		return false;
	}
	return _.every(pos.look(), function (item) {
		if (respect_walls && item.type == LOOK_TERRAIN) {
			return item.terrain !== "wall";
		}
		return true;
	});
}

function get_next_adjacent(room, pos, layer = 1, avoid_pos = null) {
	if (avoid_pos == null) {
		avoid_pos = [];
	}
	let next;
	for (; next == null; layer++) {
		let l = parseInt(layer);
		let options = [];
		for (let n = 0 - layer; n <= layer - 2; n += 2) {
			let m = parseInt(n);
			options.push(
				room.getPositionAt(pos.x - l, pos.y + m),
				room.getPositionAt(pos.x + l, pos.y + m),
				room.getPositionAt(pos.x + m, pos.y - l),
				room.getPositionAt(pos.x + m, pos.y + l),
			);
		}
		options = options.filter(function (option) {
			return !avoid_pos.includes(option.x + ":" + option.y);
		});
		next = pos.findClosestByPath(options, {
			ignoreCreeps: true,
			ignoreRoads: true,
			swampCost: 1,
			filter: can_build_here,
		});
	}
	return next;
}

module.exports = {
	place_extensions: function (room, spawn) {
		const room_level = room.controller.level;
		let max_entensions;
		if (room_level < 2) {
			max_entensions = 0;
		} else if (room_level == 2) {
			max_entensions = 5;
		} else {
			max_entensions = (room_level - 2) * 10;
		}
		let extension_sites = room.find(FIND_FLAGS, {
			filter: { color: COLOR_CYAN, secondaryColor: COLOR_GREEN },
		});
		if (extension_sites < max_entensions) {
			let new_site = get_next_adjacent(
				room,
				spawn.pos,
				2,
				Memory[room.name].extensions,
			);
			clear_space(new_site);
			place_road_around(room, new_site);
			new_site.createFlag(
				"build:" + STRUCTURE_EXTENSION + ":" + extension_sites,
			);
			Memory[room.name].extensions.push(new_site.x + ":" + new_site.y);
		}
	},
	place_source_roads: function (spawn) {
		this.set_up_memory(spawn.id, {});
		this.set_up_memory(spawn.id, [], "roads");
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				return !Memory[spawn.id].roads.includes(_source.id);
			},
		});
		if (_source) {
			place_road(spawn.room, _source.pos, spawn.pos);
			place_road(spawn.room, _source.pos, spawn.room.controller.pos);
			Memory[spawn.id].roads.push(_source.id);
		}
	},
	place_towers: function (room) {
		const room_level = room.controller.level;
		let max_towers = 0;
		switch (true) {
			case room_level == 8:
				max_towers += 3;
			case room_level == 7:
				max_towers += 1;
			case [5, 6].includes(room_level):
				max_towers += 1;
			case [3, 4].includes(room_level):
				max_towers += 1;
		}
		/*room.find(FIND_FLAGS, {
			filter: { color: COLOR_GREEN, secondaryColor: COLOR_BROWN },
		}).length;*/
		//if (tower_sites < max_towers) {
		for (
			let tower_sites = Memory[room.name].towers.length;
			tower_sites < max_towers;
			tower_sites++
		) {
			let new_site = get_next_adjacent(
				room,
				room.controller.pos,
				2,
				Memory[room.name].towers,
			);
			new_site.lookFor(LOOK_FLAGS).forEach(function (flag) {
				flag.remove();
			});
			place_road_around(room, new_site);
			new_site.createFlag(
				"build:" + STRUCTURE_TOWER + ":" + tower_sites,
				COLOR_GREEN,
				COLOR_BROWN,
			);
			Memory[room.name].towers.push(new_site.x + ":" + new_site.y);
		}
	},
	set_up_memory: function (path, value, sub_path = null) {
		if (sub_path) {
			if (Memory[path][sub_path] == null) {
				Memory[path][sub_path] = value;
			}
		} else if (Memory[path] == null) {
			Memory[path] = value;
		}
	},
};
