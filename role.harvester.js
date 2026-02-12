var pick_source = require('pick.source')

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.store.getFreeCapacity() > 0) {
            let _source = pick_source.pick(creep);
            if(!_source) {
                return null;
            };
            console.log('Chosen Source at: [' + _source.pos.x + ', ' + _source.pos.y + ']');
            if(creep.harvest(_source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(_source, {visualizePathStyle: {stroke: '#ffaa00'}});
            };
        } else {
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) && 
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(target) {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            };
        };
	}
};