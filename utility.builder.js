/**
 * Build roads from the origin to the target & room controller
 * @param {RoomPosition} origin
 * @param {RoomPosition} target
 */
function build_road(origin, target) {
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
			if (can_build_road(origin_adjacent)) {
				let pos = [origin_adjacent.x, origin_adjacent.y];
				if (!road_positions.includes(pos)) {
					road_positions.push(pos);
				}
				[target, origin.room.controller].forEach(function (_target) {
					steps = origin_adjacent.findPathTo(_target, {
						ignoreCreeps: true,
						swampCost: 1,
					});
					steps.pop();
					steps.forEach(function (step, _) {
						pos = [step.x, step.y];
						if (!road_positions.includes(pos)) {
							road_positions.push(pos);
						}
					});
				});
			}
		}
	}

	for (let i = -1; i <= 1; i++) {
		for (let j = -1; j <= 1; j++) {
			if (i == 0 && j == 0) {
				continue;
			}
			[target, origin.room.controller].forEach(function (_target) {
				target_adjacent = origin.room.getPositionAt(
					_target.pos.x + parseInt(i),
					_target.pos.y + parseInt(j),
				);
				if (can_build_road(target_adjacent)) {
					let pos = [target_adjacent.x, target_adjacent.y];
					if (!road_positions.includes(pos)) {
						road_positions.push(pos);
					}
				}
			});
		}
	}

	road_positions.forEach(function (coord, _) {
		pos = origin.room.getPositionAt(coord[0], coord[1]);
		// Ensure there isn't already a road here
		let build = true;
		pos.look().forEach(function (item) {
			if (
				item.type == LOOK_STRUCTURES &&
				item.structure == STRUCTURE_ROAD
			) {
				build = false;
			}
		});
		if (build) {
			pos.createConstructionSite(STRUCTURE_ROAD);
		}
	});
}

/** @param {RoomPosition} pos **/
function can_build_road(pos) {
	console.log("-----");
	return _.every(pos.look(), function (item) {
		console.log("item keys: " + Object.keys(item));
		/*if (item.type === LOOK_TERRAIN) {
				return item.terrain !== "wall";
			}*/
		if (item.type === LOOK_STRUCTURES) {
			return item.structureType === STRUCTURE_ROAD;
		}
		return true;
	});
}



module.exports = {
	build_roads: function (spawn) {
		/*if (!Memory.built_roads) {
			Memory.built_roads = [];
		}
		if (!Memory.built_roads[spawn.id]) {
			Memory.built_roads[spawn.id] = [];
		}*/
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				return !Memory.built_roads[spawn.id].includes(_source.id);
			},
		});
		build_road(_source, spawn);
		Memory.built_roads[spawn.id].push(_source.id);
	},
};
