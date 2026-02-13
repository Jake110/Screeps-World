const isObstacle = _.transform(
	OBSTACLE_OBJECT_TYPES,
	(o, type) => {
		o[type] = true;
	},
	{},
);

function build_road(origin, target) {
	/** @param {RoomPosition} pos **/
	function isEnterable(pos) {
		return _.every(pos.look(), (item) =>
			item.type === "terrain"
				? item.terrain !== "wall"
				: !isObstacle[item.structureType],
		);
	}
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
			if (isEnterable(origin_adjacent)) {
				let pos = [origin_adjacent.x, origin_adjacent.y];
				if (road_positions.indexOf(pos) == -1) {
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
						if (road_positions.indexOf(pos) == -1) {
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
				if (isEnterable(target_adjacent)) {
					let pos = [target_adjacent.x, target_adjacent.y];
					if (road_positions.indexOf(pos) == -1) {
						road_positions.push(pos);
					}
				}
			});
		}
	}

	road_positions.forEach(function (coord, _) {
		origin.room.createConstructionSite(coord[0], coord[1], STRUCTURE_ROAD);
	});
}

module.exports = {
	build_roads: function (spawn) {
		if (!Memory.built_roads) {
			Memory.built_roads = [];
		}
		if (!Memory.built_roads[spawn.id]) {
			Memory.built_roads[spawn.id] = [];
		}
		_source = spawn.pos.findClosestByPath(FIND_SOURCES, {
			filter: function (_source) {
				return Memory.built_roads[spawn.id].indexOf(_source.id) == -1;
			},
		});
		build_road(_source, spawn);
		Memory.built_roads[spawn.id].push(_source.id);
	},
};
