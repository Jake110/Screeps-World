const memory = require("utility.memory");

module.exports = {
	get_structure: function (room, coord, structure_type) {
		let found_structure = null;
		memory
			.coord_to_pos(coord, room)
			.look()
			.forEach(function (item) {
				let structure = item.structure;
				if (structure) {
					if (structure.structureType == structure_type) {
						found_structure = structure;
					}
				}
			});
		return found_structure;
	},
};
