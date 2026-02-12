const isObstacle = _.transform(
	OBSTACLE_OBJECT_TYPES,
	(o, type) => {
		o[type] = true;
	},
	{},
);

function build_road(_source, target) {
	/** @param {RoomPosition} pos **/
	function isEnterable(pos) {
		return _.every(pos.look(), (item) =>
			item.type === "terrain"
				? item.terrain !== "wall"
				: !isObstacle[item.structureType],
		);
	}
	function place_road(pos) {
		console.log(pos.look());
		console.log("Building Road at: " + source_adjacent);
		source_adjacent.createConstructionSite(STRUCTURE_ROAD);
	}
	for (let n = -1; n <= 1; n++) {
		for (let m = -1; m <= 1; m++) {
			source_adjacent = target.room.getPositionAt(
				_source.pos.x + parseInt(n),
				_source.pos.y + parseInt(m),
			);
			if (isEnterable(source_adjacent)) {
				place_road(source_adjacent);
				steps = source_adjacent.findPathTo(target, {
					ignoreCreeps: true,
					swampCost: 1,
				});
				steps.pop();
				for (let n in steps) {
					step = steps[n];
					target.room.createConstructionSite(
						step.x,
						step.y,
						STRUCTURE_ROAD,
					);
				}
				for (let i = -1; i <= 1; i++) {
					for (let j = -1; j <= 1; j++) {
						target_adjacent = target.room.getPositionAt(
							target.pos.x + parseInt(i),
							target.pos.y + parseInt(j),
						);
						if (isEnterable(target_adjacent)) {
						}
					}
				}
			}
		}
	}
}

module.exports = {
	build_roads: function (spawn) {
		for (let _source in spawn.room.find(FIND_SOURCES)) {
			// Build roads between source and Spawn/Controller
			build_road(_source, spawn);
			build_road(_source, spawn.room.controller);
		}
	},
};
