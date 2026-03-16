const memory = require("utility.memory");

module.exports = {
	get_structure: function (room, coord, structure_type) {
		let structure = null;
		memory
			.coord_to_pos(coord, room)
			.look()
			.forEach(function (item) {
				console.log("Item type: " + item.type);
				console.log("Item structureType: " + item.structureType);
				if (
					item.type == LOOK_STRUCTURES &&
					item.structureType == structure_type
				) {
					structure = item;
					console.log(
						"Found [" + structure_type + "] at [" + coord + "]",
					);
				}
			});
		console.log("\tReturning: " + structure);
		return structure;
	},
};
