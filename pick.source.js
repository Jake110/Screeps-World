module.exports = {
	/** @param {Creep} creep **/
	pick: function (creep) {
		return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
			filter: function (_source) {
				console.log(
					"Checking Source at: [" +
						_source.pos.x +
						", " +
						_source.pos.y +
						"]",
				);
				let closest_hostile = _source.pos.findClosestByPath(
					FIND_HOSTILE_CREEPS,
					{
						filter: function (object) {
							return (
								object.getActiveBodyparts(ATTACK) == 0 ||
								object.getActiveBodyparts(RANGED_ATTACK) == 0
							);
						},
					},
				);
				if (closest_hostile) {
					console.log(
						"\tHostile at: [" +
							closest_hostile.pos.x +
							", " +
							closest_hostile.pos.y +
							"]",
					);
					if (closest_hostile.pos.getRangeTo(_source) < 10) {
						console.log("\t\tToo close!");
						return false;
					}
				}
				console.log();
				return _source.energy < creep.store.getFreeCapacity();
			},
		});
	},
};
