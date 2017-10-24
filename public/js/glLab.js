var events = require('./events.js');
window.world = require('./world.js');
window.renderer = require('./renderer.js');

world.loadItems(JSON.parse( '['+
            '{"entity":"zombie","pos":{"x":1500,"y":1500,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"wall","pos":{"x":2100,"y":2100,"rot":1.028333665452588},"width":250,"height":150},'+
            '{"entity":"wall","pos":{"x":1300,"y":2100,"rot":1.028333665452588},"width":250,"height":350},'+
            '{"entity":"wall","pos":{"x":1700,"y":2100,"rot":1.028333665452588},"width":250,"height":250},'+
            '{"entity":"wall","pos":{"x":2100,"y":1660,"rot":1.028333665452588},"width":550,"height":150},'+
            '{"entity":"zombie","pos":{"x":2170,"y":2170,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"zombie","pos":{"x":1500,"y":1500,"rot":0.028333665452588},"radius":50},'+
            '{"entity":"zombie","pos":{"x":2401,"y":2401,"rot":0.749632850988619},"radius":250}]' ));
            

window.addEventListener('load', function() {
    world.step();
    renderer.connectCamera(world.getItems()[0]);

    events.register('animate', function() {
        world.getItems().forEach(function(item) {
            item.move({rot: item.pos.rot + .05});
        });
        renderer.step();
    }, 'mainEventLoop');
});

