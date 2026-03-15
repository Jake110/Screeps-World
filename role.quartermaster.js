const hauler = require("creep.hauler");
const memory = require("utility.memory");

function get_structure(room, coord, structure_type) {
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
}

module.exports = {
	run: function (creep) {
		let room_memory = creep.room.memory;
		hauler.capacity_check(creep, RESOURCE_ENERGY);
		if (creep.memory.full) {
			let storage = get_structure(
				creep.room,
				room_memory.storage,
				STRUCTURE_STORAGE,
			);
			if (storage) {
				if (
					creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
				) {
					creep.moveTo(storage, {
						visualizePathStyle: { stroke: "#2bff00" },
					});
				}
			} else {
				hauler.recharge(creep);
			}
		} else {
			let core_link = get_structure(
				creep.room,
				room_memory.links[0],
				STRUCTURE_LINK,
			);
			if (core_link) {
				if (
					creep.withdraw(core_link, RESOURCE_ENERGY) ==
					ERR_NOT_IN_RANGE
				) {
					creep.moveTo(target, {
						visualizePathStyle: { stroke: "#fff23e" },
					});
				}
			} else {
				hauler.collect(creep);
			}
		}
	},
};
