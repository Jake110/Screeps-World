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
	function place_road(pos) {
		console.log("\tChecking: " + pos);
		let no_construction = true;
		pos.look().forEach(function (lookObject) {
			if (lookObject.type == LOOK_CONSTRUCTION_SITES) {
				no_construction = false;
			}
		});
		if (no_construction) {
			console.log("\t\tAlready in use!");
		} else {
			console.log("\tBuilding Road at: " + pos);
			pos.createConstructionSite(STRUCTURE_ROAD);
		}
	}
	console.log(origin.pos);
	for (let n = -1; n <= 1; n++) {
		for (let m = -1; m <= 1; m++) {
			origin_adjacent = origin.room.getPositionAt(
				origin.pos.x + parseInt(n),
				origin.pos.y + parseInt(m),
			);
			if (isEnterable(origin_adjacent)) {
				place_road(origin_adjacent);
				steps = origin_adjacent.findPathTo(target, {
					ignoreCreeps: true,
					swampCost: 1,
				});
				steps.pop();
				steps.forEach(function (step, _) {
					origin.room.createConstructionSite(
						step.x,
						step.y,
						STRUCTURE_ROAD,
					);
				});
				for (let i = -1; i <= 1; i++) {
					for (let j = -1; j <= 1; j++) {
						target_adjacent = origin.room.getPositionAt(
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
		spawn.room.find(FIND_SOURCES).forEach(function (_source, _) {
			// Build roads between source and Spawn/Controller
			build_road(_source, spawn);
			build_road(_source, spawn.room.controller);
		});
	},
};
