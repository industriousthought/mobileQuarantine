var wall = require('./wall.js');
var makeStartOptions = require('./makeStartOptions.js');

module.exports = function(options) {
    var door = wall(options);
    makeStartOptions(door);
    door.startOptions({speed: options.speed});
    door.type = 'door';
    door.openPos = options.openPos || options.pos;
    door.closePos = options.closePos || options.pos;
    door.opened = options.opened || true;

    var progress = (door.opened) ? 1 : 0;
    var startTime;
    var updatePos = function(toggle) {
        if (toggle) progress = (door.opened) ? 1 : 0;
        door.move({
            x: door.openPos.x + (door.closePos.x - door.openPos.x) * progress,
            y: door.openPos.y + (door.closePos.y - door.openPos.y) * progress,
            rot: door.openPos.rot + (door.closePos.rot - door.openPos.rot) * progress
        });
    };

    door.updatePos = updatePos;

    updatePos();

    if (!door.verbs) door.verbs = {};
    door.verbs.open = function() {
        if (door.opened) {
            door.opened = false;
            door.addEffect(function() {
                progress -= options.speed;
                if (progress < 0) progress = 0;
                updatePos();
                return (progress && !door.opened);
            });
        } else {
            door.opened = true;
            door.addEffect(function() {
                progress += options.speed;
                if (progress > 1) progress = 1;
                updatePos();
                return (progress - 1 && door.opened);
            });
        }
    };

    return door;
};

