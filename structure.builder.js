const memory = require("utility.memory");

/**
 * Map a road from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(room, origin, target, respect_walls, range = 0) {
	if (respect_walls) {
		steps = origin.findPathTo(target, {
			ignoreCreeps: true,
			ignoreRoads: true,
			costCallback: function adjust_cost_matrix(roomName, costMatrix) {
				let _room = null;
				try {
					_room = Game.rooms[roomName];
				} catch {}
				if (_room != null) {
					memory.build_pos(_room).forEach(function (pos) {
						// Set all building positions to be non-walkable
						costMatrix.set(pos.x, pos.y, 0xff);
					});
				}
			},
			range: range,
			swampCost: 1,
		});
		steps.pop();
		steps.forEach(function (step) {
			save_road(room.name, step.x + ":" + step.y);
		});
	} else {
		let x = origin.x;
		let y = origin.y;
		let route = [];
		while (x != target.x && y != target.y) {
			let pos = room.getPositionAt(x, y);
			switch (pos.getDirectionTo(target)) {
				case 1:
					y--;
					break;
				case 2:
					x++;
					y--;
					break;
				case 3:
					x++;
					break;
				case 4:
					x++;
					y++;
					break;
				case 5:
					y++;
					break;
				case 6:
					x--;
					y++;
					break;
				case 7:
					x--;
					break;
				case 8:
					x--;
					y--;
					break;
			}
			route.push(x + ":" + y);
		}
		for (; range > 0; range--) {
			route.pop();
		}
		route.forEach(function (coord) {
			save_road(room.name, coord);
		});
	}
	place_road_around(room, origin, true, respect_walls);
	place_road_around(room, origin, true, respect_walls, 2);
}

function place_road_around(
	room,
	pos,
	square = false,
	respect_walls = true,
	radius = 1,
) {
	let sides = [0 - radius, radius];
	for (let n = 0 - radius; n <= radius; n++) {
		for (let m = 0 - radius; m <= radius; m++) {
			if (
				(!sides.includes(n) && !sides.includes(m)) ||
				(!square && n != 0 && m != 0)
			) {
				// Only place road in the radius zone
				// Don't place road in the corners unless flagged as square
				continue;
			}
			origin_adjacent = room.getPositionAt(
				pos.x + parseInt(n),
				pos.y + parseInt(m),
			);
			if (can_build_here(origin_adjacent, respect_walls)) {
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
		Memory[pos.roomName].extensions.includes(coord)
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

function get_next_adjacent(room, pos, layer = 1) {
	let avoid_pos = memory.build_coords(room.name);
	let next;
	for (; !next; layer++) {
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

function remove_road(pos) {
	coord = pos.x + ":" + pos.y;
	index = Memory[pos.roomName].roads.indexOf(coord);
	if (index != -1) {
		Memory[pos.roomName].roads.splice(index, 1);

		pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
			structure.destroy();
		});
		pos.lookFor(LOOK_CONSTRUCTION_SITES).forEach(function (site) {
			site.remove();
		});
	}
}

module.exports = {
	create_construction_sites: function (room, path, structure_type) {
		let unfinished_count = 0;
		Memory[room.name][path].forEach(function (coord) {
			let x = parseInt(coord.split(":")[0]);
			let y = parseInt(coord.split(":")[1]);
			pos = room.getPositionAt(x, y);
			let unfinished = true;
			pos.lookFor(LOOK_STRUCTURES).forEach(function (structure) {
				if (structure.structureType == structure_type) {
					unfinished = false;
				}
			});
			if (unfinished) {
				unfinished_count++;
				if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length == 0) {
					pos.createConstructionSite(structure_type);
				}
			}
		});
		return unfinished_count;
	},
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
		if (max_entensions > 20) {
			max_entensions = 20;
		}
		if (Memory[room.name].extensions.length < max_entensions) {
			let new_site = get_next_adjacent(room, spawn.pos, 2);
			remove_road(new_site);
			place_road_around(room, new_site);
			Memory[room.name].extensions.push(new_site.x + ":" + new_site.y);
		}
		this.create_construction_sites(room, "extensions", STRUCTURE_EXTENSION);
	},
	place_source_roads: function (spawn) {
		memory.set_up_memory(spawn.id, [], "roads");
		memory.set_up_memory(spawn.id, [], "tunnels");
		let mode = "roads";
		let respect_walls = true;
		if (spawn.room.controller.level > 4) {
			mode = "tunnels";
			respect_walls = false;
		}
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				if (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length != 0 &&
					Memory[spawn.room.name].towers.length == 0
				) {
					return false;
				}
				return !Memory[spawn.id][mode].includes(_source.id);
			},
		});
		if (_source) {
			place_road_around(spawn.room, spawn.pos, true, respect_walls);
			place_road_around(
				spawn.room,
				spawn.room.controller.pos,
				true,
				respect_walls,
				3,
			);
			place_road_around(
				spawn.room,
				spawn.room.controller.pos,
				true,
				respect_walls,
				4,
			);

			place_road(spawn.room, _source.pos, spawn.pos);
			place_road(spawn.room, _source.pos, spawn.room.controller.pos, 4);
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
		for (
			let tower_sites = Memory[room.name].towers.length;
			tower_sites < max_towers;
			tower_sites++
		) {
			let new_site = get_next_adjacent(room, room.controller.pos);
			remove_road(new_site);
			place_road_around(room, new_site);
			Memory[room.name].towers.push(new_site.x + ":" + new_site.y);
		}
		this.create_construction_sites(room, "towers", STRUCTURE_TOWER);
	},
};
