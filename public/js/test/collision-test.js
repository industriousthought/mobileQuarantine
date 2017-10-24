var collision = require('../collision.js');
var world = require('../world.js');
var consoleRender = require('../consoleRender.js');
world.loadLevel('test');

world.step();
world.step();
collision.step();
world.step();
world.step();
world.step();
consoleRender(world.getItems());
