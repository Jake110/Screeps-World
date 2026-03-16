const memory = require("utility.memory");

module.exports = {
	get_structure: function (room, coord, structure_type) {
		let structure = null;
		memory
			.coord_to_pos(coord, room)
			.look()
			.forEach(function (item) {
				if (item.structure) {
					if (item.structure.structureType == structure_type) {
						structure = item;
						console.log(
							"Found [" + structure_type + "] at [" + coord + "]",
						);
					}
				}
			});
		console.log("\tReturning: " + structure);
		return structure;
	},
};
