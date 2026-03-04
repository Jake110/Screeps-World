const memory = require("utility.memory");

function step_with_coord(
	x,
	y,
	target,
	room,
	pos_return = false,
	leave = false,
) {
	let pass_room = false;
	if (pos_return) {
		pass_room = room;
	}
	return step_with_pos(room.getPositionAt(x, y), target, pass_room, leave);
}

function step_with_pos(pos, target, pos_return = false, leave = false) {
	let x = pos.x;
	let y = pos.y;
	let direction = pos.getDirectionTo(target);
	if (leave) {
		if (direction > 4) {
			direction -= 4;
		} else {
			direction += 4;
		}
	}
	switch (direction) {
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
	if (pos_return) {
		return pos_return.getPositionAt(x, y);
	}
	return x + ":" + y;
}

function place_container(room, source_pos, spawn_pos) {
	let harvest_points = [];
	for (let x = -1; x <= 1; x++) {
		for (let y = -1; y <= 1; y++) {
			if (x == 0 && y == 0) {
				// Ignore the source tile
				continue;
			}
			let pos = room.getPositionAt(source_pos.x + x, source_pos.y + y);
			if (can_build_here(pos, true)) {
				harvest_points.push(pos);
			}
		}
	}
	let pos = spawn_pos.findClosestByPath(harvest_points);
	let coord = memory.pos_to_coord(pos);
	room.memory.containers.push(coord);
	save_road(room, coord);
	return pos;
}

function place_wall(room, pos, dist = 2) {
	let pos_wall = shift_to_centre(room, pos, dist);
	if (can_build_here(pos_wall, true)) {
		room.memory.walls.push(memory.pos_to_coord(pos_wall));
	}
}

function place_rampart(room, start, end) {
	let x = Math.round((start.x + end.x) / 2);
	let y = Math.round((start.y + end.y) / 2);
	let pos_mid;
	if (![0, 49].includes(x) && ![0, 49].includes(y)) {
		let x_diff = 49 - x;
		let y_diff = 49 - y;
		switch ((x < 25) + ":" + (y < 25)) {
			case "true:true":
				if (x > y) {
					x -= y;
					y = 0;
				} else {
					y -= x;
					x = 0;
				}
				break;
			case "true:false":
				if (x > y_diff) {
					x -= y_diff;
					y = 49;
				} else {
					y += x;
					x = 0;
				}
				break;
			case "false:true":
				if (x_diff > y) {
					x += y;
					y = 0;
				} else {
					y -= x_diff;
					x = 49;
				}
				break;
			case "false:false":
				if (x_diff > y_diff) {
					x += y_diff;
					y = 49;
				} else {
					y += x_diff;
					x = 49;
				}
		}
	}
	pos_mid = room.getPositionAt(x, y);
	pos_rampart = shift_to_centre(room, pos_mid, 2);
	room_memory = room.memory
	if (
		!can_build_here(pos_rampart, true) ||
		!can_get_to_core(room, pos_rampart)
	) {
		pos_wall_list = [];
		room_memory.walls.forEach(function (wall_coord) {
			pos_wall_list.push(memory.coord_to_pos(wall_coord));
		});
		pos_rampart = pos_rampart.findClosestByRange(pos_wall_list);
	}
	coord = memory.pos_to_coord(pos_rampart)
	const index = room_memory.walls.indexOf(coord)
	if (index != -1) {
		room_memory.walls.splice(index, 1)
	}
	room_memory.ramparts.push(coord)
}

/**
 * Map a road from the origin to the target
 * @param {Room} room
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(
	room,
	origin,
	target,
	mode,
	range = 0,
	link_points = null,
	avoid = null,
) {
	let route = [];
	if (mode == "roads") {
		route = origin.findPathTo(target, {
			ignoreCreeps: true,
			ignoreRoads: true,
			costCallback: function (roomName, costMatrix) {
				let _room = null;
				try {
					_room = Game.rooms[roomName];
				} catch {}
				if (_room != null) {
					let adjust_matrix = function (pos) {
						// Set all positions to be non-walkable
						costMatrix.set(pos.x, pos.y, 0xff);
					};
					memory.build_pos(_room).forEach(adjust_matrix);
					if (avoid) {
						avoid.forEach(function (coord) {
							adjust_matrix(memory.coord_to_pos(coord, room));
						});
					}
				}
			},
			swampCost: 1,
		});
		for (; range > 0; range--) {
			route.pop();
		}
		if (!avoid) {
			route.pop();
			route.shift();
		}
		route.forEach(function (step) {
			save_road(room, memory.pos_to_coord(step));
		});
	} else {
		let x = origin.x;
		let y = origin.y;
		while (x != target.x && y != target.y) {
			route.push(step_with_coord(x, y, target, room));
		}
		for (; range > 0; range--) {
			route.pop();
		}
		route.forEach(function (coord) {
			save_road(room, coord);
		});
	}
	if (link_points) {
		link_points.outer.forEach(function (link_point) {
			place_road(
				room,
				link_point,
				target,
				mode,
				0,
				null,
				link_points.inner,
			);
		});
	}
}

function place_road_around(
	room,
	pos,
	mode,
	square = false,
	radius = 1,
	thickness = 1,
	full_inner_ring = false,
	return_inner_ring = false,
) {
	let outer_edges = [0 - radius, radius];
	let outer_ring = [];
	let inner_edges = [-1 - radius + thickness, 1 + radius - thickness];
	let inner_ring = [];
	for (let n = 0 - radius; n <= radius; n++) {
		for (let m = 0 - radius; m <= radius; m++) {
			let outer_edge = outer_edges.includes(n) || outer_edges.includes(m);
			let inner_edge = inner_edges.includes(n) || inner_edges.includes(m);
			if (
				(!full_inner_ring &&
					!outer_edge &&
					(!inner_edge ||
						inner_edges.includes(n) != inner_edges.includes(m))) ||
				(full_inner_ring && !outer_edge && !inner_edge) ||
				(!square && outer_edges.includes(n) && outer_edges.includes(m))
			) {
				// Only place road in the radius zone
				// Don't place road in the corners unless flagged as square
				continue;
			}
			if (outer_edge) {
				pos_step = room.getPositionAt(pos.x + n, pos.y + m);
				let steps = [];
				for (let thick = 0; thick < thickness; thick++) {
					if (thick > 0) {
						pos_step = step_with_pos(pos_step, pos, room);
					}
					if (!can_build_here(pos_step, mode == "roads")) {
						break;
					}
					steps.push(pos_step);
				}
				if (steps.length != thickness) {
					continue;
				}
				steps.forEach(function (step) {
					save_road(room, memory.pos_to_coord(step));
				});
				outer_ring.push(steps[0]);
				if (return_inner_ring) {
					let inner_tile = memory.pos_to_coord(
						steps[steps.length - 1],
					);
					if (!inner_ring.includes(inner_tile)) {
						inner_ring.push(inner_tile);
					}
				}
			} else {
				let coord = pos.x + n + ":" + (pos.y + m);
				if (
					can_build_here(
						memory.coord_to_pos(coord, room),
						mode == "roads",
					)
				) {
					save_road(room, coord);
					if (return_inner_ring && !inner_ring.includes(coord)) {
						inner_ring.push(coord);
					}
				}
			}
		}
	}
	return {
		outer: outer_ring,
		inner: inner_ring,
	};
}

function save_road(room, coord) {
	let mode = "roads";
	if (
		new Room.Terrain(room.name).get(
			coord.split(":")[0],
			coord.split(":")[1],
		) == TERRAIN_MASK_WALL
	) {
		mode = "tunnels";
	}
	let current = room.memory[mode];
	if (!current.includes(coord)) {
		current.push(coord);
	}
}

function shift_to_centre(room, pos, dist) {
	let x = pos.x;
	let y = pos.y;
	if (pos.x == 0) {
		x = pos.x + dist;
	} else if (pos.x == 49) {
		x = pos.x - dist;
	} else if (pos.y == 0) {
		y = pos.y + dist;
	} else {
		y = pos.y - dist;
	}
	return room.getPositionAt(x, y);
}

/**
 * @param {RoomPosition} pos
 * @param {boolean} respect_walls
 **/
function can_build_here(pos, respect_walls = false) {
	coord = memory.pos_to_coord(pos);
	let room_memory = Memory.rooms[pos.roomName];
	if (
		room_memory.extensions.includes(coord) ||
		room_memory.towers.includes(coord) ||
		room_memory.walls.includes(coord)
	) {
		return false;
	}
	if (respect_walls) {
		return _.every(pos.look(), function (item) {
			if (item.type == LOOK_TERRAIN) {
				return item.terrain !== "wall";
			}
			return true;
		});
	}
	return true;
}

function can_get_to_core(room, pos) {
	let room_memory = room.memory;
	let pos_core = memory.coord_to_pos(room_memory.core);
	let route = pos.findPathTo(pos_core, {
		ignoreCreeps: true,
		costCallback: function (roomName, costMatrix) {
			let _room = null;
			try {
				_room = Game.rooms[roomName];
			} catch {}
			if (_room != null) {
				let adjust_matrix = function (pos) {
					// Set all positions to be non-walkable
					costMatrix.set(pos.x, pos.y, 0xff);
				};
				memory.build_pos(_room).forEach(adjust_matrix);
				room_memory.walls.forEach(function (coord) {
					adjust_matrix(memory.coord_to_pos(coord, room));
				});
			}
		},
	});
	if (route.length == 0) {
		return false;
	}
	let last_step = route[route.length - 1];
	return last_step.x == pos_core.x && last_step.y == pos_core.y;
}

function exit_edge_check(
	room,
	index,
	exit_list,
	clockwise = true,
	place_the_wall = true,
) {
	let pos = exit_list[index];
	let index_adjacent;
	if (clockwise) {
		if (index == exit_list.length - 1) {
			index_adjacent = 0;
		} else {
			index_adjacent = index + 1;
		}
	} else {
		if (index == 0) {
			index_adjacent = exit_list.length - 1;
		} else {
			index_adjacent = index - 1;
		}
	}
	let pos_adjacent_index = exit_list[index_adjacent];
	if (
		(pos.x != pos_adjacent_index.x ||
			![pos.y - 1, pos.y + 1].includes(pos_adjacent_index.y)) &&
		(pos.y != pos_adjacent_index.y ||
			![pos.x - 1, pos.x + 1].includes(pos_adjacent_index.x))
	) {
		if (place_the_wall) {
			let x = pos.x;
			let y = pos.y;
			if (clockwise) {
				if (pos.x == 0) {
					y--;
				} else if (pos.x == 49) {
					y++;
				} else if (pos.y == 0) {
					x++;
				} else {
					x--;
				}
			} else {
				if (pos.x == 0) {
					y++;
				} else if (pos.x == 49) {
					y--;
				} else if (pos.y == 0) {
					x--;
				} else {
					x++;
				}
			}
			console.log("Getting adjacent position at [" + x + ", " + y + "]");
			let pos_adjacent = room.getPositionAt(x, y);
			console.log("Position: " + pos_adjacent);
			place_wall(room, pos_adjacent, 1);
			place_wall(room, pos_adjacent);
		}
		return true;
	}
	return false;
}

function get_next_adjacent(room, pos, layer = 1) {
	let avoid_pos = memory.build_coords(room);
	let next;
	for (; !next; layer++) {
		let options = [];
		for (let n = 0 - layer; n <= layer - 2; n += 2) {
			options.push(
				room.getPositionAt(pos.x - layer, pos.y + n),
				room.getPositionAt(pos.x + layer, pos.y + n),
				room.getPositionAt(pos.x + n, pos.y - layer),
				room.getPositionAt(pos.x + n, pos.y + layer),
			);
		}
		options = options.filter(function (option) {
			return !avoid_pos.includes(memory.pos_to_coord(option));
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
	let mode = "roads";
	if (new Room.Terrain(pos.roomName).get(pos.x, pos.y) == TERRAIN_MASK_WALL) {
		mode = "tunnels";
	}
	coord = memory.pos_to_coord(pos);
	let memory_list = Memory.rooms[pos.roomName][mode];
	index = memory_list.indexOf(coord);
	if (index != -1) {
		memory_list.splice(index, 1);

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
		room.memory[path].forEach(function (coord) {
			pos = memory.coord_to_pos(coord, room);
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
	place_controller_road: function (spawn, mode) {
		let memory_list = spawn.room.memory.source_connections[mode];
		if (!memory_list.includes("controller")) {
			place_road_around(spawn.room, spawn.pos, mode);
			place_road_around(
				spawn.room,
				spawn.room.controller.pos,
				mode,
				false,
				3,
			);
			place_road(
				spawn.room,
				spawn.pos,
				spawn.room.controller.pos,
				mode,
				3,
			);
			memory_list.push("controller");
		}
	},
	place_extensions: function (spawn) {
		const room_level = spawn.room.controller.level;
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
		let extension_list = spawn.room.memory.extensions;
		if (extension_list.length < max_entensions) {
			let new_site = get_next_adjacent(spawn.room, spawn.pos, 2);
			remove_road(new_site);
			place_road_around(spawn.room, new_site, "roads");
			extension_list.push(memory.pos_to_coord(new_site));
		}
		this.create_construction_sites(
			spawn.room,
			"extensions",
			STRUCTURE_EXTENSION,
		);
	},
	place_source_roads: function (spawn, mode) {
		let room_memory = spawn.room.memory;
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				if (
					_source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20)
						.length != 0 &&
					room_memory.towers.length == 0
				) {
					return false;
				}
				return !room_memory.source_connections[mode].includes(
					_source.id,
				);
			},
		});
		if (_source) {
			let container = _source.pos.findInRange(FIND_STRUCTURES, 1, {
				filter: { structureType: STRUCTURE_CONTAINER },
			})[0];
			let container_pos;
			if (container) {
				container_pos = container.pos;
			} else {
				container_pos = place_container(
					spawn.room,
					_source.pos,
					spawn.pos,
				);
			}
			place_road(spawn.room, spawn.pos, container_pos, mode);
			room_memory.source_connections[mode].push(_source.id);
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
		let towers_list = room.memory.towers;
		for (
			let tower_sites = towers_list.length;
			tower_sites < max_towers;
			tower_sites++
		) {
			let new_site = get_next_adjacent(room, room.controller.pos);
			remove_road(new_site);
			place_road_around(room, new_site, "roads");
			towers_list.push(memory.pos_to_coord(new_site));
		}
		this.create_construction_sites(room, "towers", STRUCTURE_TOWER);
	},
	place_walls: function (room) {
		let room_memory = room.memory;
		if (room.controller.level >= 3 && room_memory.walls.length == 0) {
			console.log("Starting wall placement");
			let side_top = [];
			let side_right = [];
			let side_bottom = [];
			let side_left = [];
			let find_exit = function (x, y, side_list) {
				let pos = room.getPositionAt(x, y);
				if (can_build_here(pos, true)) {
					side_list.push(pos);
				}
			};
			for (let row = 0; row < 50; row++) {
				find_exit(row, 0, side_top);
				find_exit(49, row, side_right);
				find_exit(row, 49, side_bottom);
				find_exit(0, row, side_left);
			}
			side_bottom.reverse();
			side_left.reverse();
			console.log("Placing Walls");
			let exit_list = side_top.concat(side_right, side_bottom, side_left);
			let exit_start;
			let exit_end;
			for (let index = 0; index < exit_list.length; index++) {
				exit_edge_check(room, index, exit_list, true);
				exit_edge_check(room, index, exit_list, false);
				place_wall(room, exit_list[index]);
			}
			let verified_walls = [];
			room_memory.walls.forEach(function (coord) {
				if (can_get_to_core(room, memory.coord_to_pos(coord))) {
					verified_walls.push(coord);
				}
			});
			room_memory.walls = verified_walls;
			for (let index = 0; index < exit_list.length; index++) {
				if (exit_edge_check(room, index, exit_list, true, false)) {
					if (exit_end) {
						place_rampart(
							room,
							exit_list[index],
							exit_list[exit_end],
						);
						exit_end = null;
					} else {
						exit_start = index;
					}
				}
				if (exit_edge_check(room, index, exit_list, false, false)) {
					if (exit_start) {
						place_rampart(
							room,
							exit_list[exit_start],
							exit_list[index],
						);
						exit_start = null;
					} else {
						exit_end = index;
					}
				}
			}
			this.create_construction_sites(room, "walls", STRUCTURE_WALL);
			this.create_construction_sites(room, "ramparts", STRUCTURE_RAMPART)
		}
	},
};
