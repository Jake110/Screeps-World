/**
 * Build roads from the origin to the target
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function place_road(origin, target) {
	let road_positions = [];
	for (let n = -1; n <= 1; n++) {
		for (let m = -1; m <= 1; m++) {
			if (n == 0 && m == 0) {
				continue;
			}
			origin_adjacent = origin.room.getPositionAt(
				origin.pos.x + parseInt(n),
				origin.pos.y + parseInt(m),
			);
			if (can_build_here(origin_adjacent, true)) {
				let pos = [origin_adjacent.x, origin_adjacent.y];
				if (!road_positions.includes(pos)) {
					road_positions.push(pos);
				}
				}
		}
	}
					steps = origin.findPathTo(target, {
						ignoreCreeps: true,
ignoreRoads: true,
						swampCost: 1,
					});
					steps.pop();
					steps.forEach(function (step) {
						pos = [step.x, step.y];
						if (!road_positions.includes(pos)) {
							road_positions.push(pos);
						}
					});
					for (let i = -1; i <= 1; i++) {
		for (let j = -1; j <= 1; j++) {
			if (i == 0 && j == 0) {
				continue;
			}
							target_adjacent = origin.room.getPositionAt(
					target.pos.x + parseInt(i),
					target.pos.y + parseInt(j),
				);
				if (can_build_here(target_adjacent, true)) {
					let pos = [target_adjacent.x, target_adjacent.y];
					if (!road_positions.includes(pos)) {
						road_positions.push(pos);
					}
				}
					}
	}
		road_positions.forEach(function (coord) {
				pos = origin.room.getPositionAt(coord[0], coord[1]);
		// Ensure there isn't already a road here
		let build = true;
		pos.look().forEach(function (item) {
			if (
				item.type === LOOK_FLAGS &&
				item.color === COLOR_BROWN &&
				item.colorSeconary === COLOR_WHITE
			) {
				build = false;
			}
		});
		if (build) {
			if (Memory.road_count == null) {
				Memory.road_count = 0;
			}
			Memory.road_count += 1;
			pos.createFlag(
				"build:" + STRUCTURE_ROAD + ":" + Memory.road_count,
				COLOR_BROWN,
				COLOR_WHITE,
			);
		}
	});
}

/** @param {RoomPosition} pos **/
function can_build_here(pos, respect_walls = false) {
		return _.every(pos.look(), function (item) {
if (respect_walls && item.type == LOOK_TERRAIN) {
			return item.terrain !== "wall";
		}
				if (item.type === LOOK_STRUCTURES) {
						return item.structureType === STRUCTURE_ROAD;
		}
		if (item.type === LOOK_CONSTRUCTION_SITES) {
			return item.constructionSite === STRUCTURE_ROAD;
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
			place_road(_source, spawn);
			place_road(_source, spawn.room.controller);
			Memory.built_roads[spawn.id].push(_source.id);
		}
	},

};
