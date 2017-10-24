var square = require('./square.js');
var makeSolid = require('./makeSolid.js');
var makeVisible = require('./makeVisible.js');

module.exports = function(options) {
    var  wall = square(options);
    makeVisible(wall);
    wall.onTop = true;
    makeSolid(wall);
    wall.type = 'wall';

    return wall;
};
