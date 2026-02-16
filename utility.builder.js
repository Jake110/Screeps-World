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
	steps.pop()
	steps.forEach(function (step) {
		place_road_flag(room.getPositionAt(step.x, step.y));
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
				if (origin_adjacent.lookFor(LOOK_FLAGS).length == 0) {
					place_road_flag(origin_adjacent);
				}
					}
				}
					}
	}

function place_road_flag(pos) {
			if (Memory.road_count == null) {
				Memory.road_count = 0;
			}
	if (pos.lookFor(LOOK_FLAGS).length == 0 && pos.lookFor(LOOK_STRUCTURE) == 0) {
			Memory.road_count += 1;
			pos.createFlag(
				"build:" + STRUCTURE_ROAD + ":" + Memory.road_count,
				COLOR_BROWN,
				COLOR_WHITE,
			);
		}
	}

/** @param {RoomPosition} pos **/
function can_build_here(pos, respect_walls = false) {
		return _.every(pos.look(), function (item) {
if (respect_walls && item.type == LOOK_TERRAIN) {
			return item.terrain !== "wall";
		}
		if (item.type === LOOK_FLAGS) {
			return (
				item.color === COLOR_BROWN && item.colorSeconary === COLOR_WHITE
			);
		}
		return true;
	});
	
}


module.exports = {
	place_source_roads: function (spawn) {
		if (Memory.built_roads == null) {
			Memory.built_roads = {};
		}
		if (Memory.built_roads[spawn.id] == null) {
			Memory.built_roads[spawn.id] = [];
		}
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				return !Memory.built_roads[spawn.id].includes(_source.id);
			},
		});
		if (_source) {
			place_road(spawn.room, _source.pos, spawn.pos);
			place_road(spawn.room, _source.pos, spawn.room.controller.pos);
			Memory.built_roads[spawn.id].push(_source.id);
		}
	},

};
