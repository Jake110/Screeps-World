const memory = require("utility.memory");

module.exports = {
    update_remote_list: function () {
        if (Game.time % 53 == 0) {
            let remotes = []
            let rooms=[]
            for (room_name in Game.rooms) {
                let room = Game.rooms[room_name]
                if (room.memory.remotes) {
                    remotes = remotes.concat(room.memory.remotes)
                    rooms.push(room)
                }
            }
            console.log("Remotes in use: " + remotes)
            console.log("Owned Rooms: "+rooms)
            for (room_name in Memory.map) {
                let map = Memory.map[room_name]
                if (map.sources) {
                    map.sources.forEach(function (source) {
                        let coord = room_name + "_" + source
                        if (remotes.indexOf(coord) == -1) {
                            console.log("Assigning: " + coord)
                            let room = Game.rooms[room_name]
                            let pos = memory.coord_to_pos(source, room)
                            console.log("Closest Room: "+pos.findClosestByPath(rooms))
                        }
                    });
                }
            }
        }
    }
}