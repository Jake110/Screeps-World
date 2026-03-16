const memory = require("utility.memory");

module.exports = {
	get_structure: function (room, coord, structure_type) {
		let structure = null;
		memory
			.coord_to_pos(coord, room)
			.look()
			.forEach(function (item) {
				if (
					item.type == LOOK_STRUCTURES &&
					item.structureType == structure_type
				) {
					structure = item;
				}
			});
		return structure;
	},
};
