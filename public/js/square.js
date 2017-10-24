var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function(options) {
    var square = baseEntity();
    makeGeometry(square, 'square');
    makeVisible(square);
    square.setDimensions({width: options.width, height: options.height});
    square.move(options.pos);
    square.base = 'square';
    square.type = 'tile';
    square.collide = function() {};

    return square;
};
