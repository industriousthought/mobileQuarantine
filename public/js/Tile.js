var isBrowser = require('../isBrowser');
var Block = require('./Block.js');

var effects = [];
var newEffects = [];
var Background = function(options) {

    if (!options) options = {pos: {}};
    var tile = Block({
        img: 'background',
        width: options.width || 200,
        height: options.height || 200,
        pos: {
            x: options.pos.x || 0,
            y: options.pos.y || 0,
            rot: 0
        },
    });

    tile.relevantOptions = [
    {  
        path: 'pos.x',
        type: 'float',
        name: 'Position X'
    },
    {
        path: 'pos.y',
        type: 'float',
        name: 'Position Y'
    },
    {
        path: 'pos.rot',
        type: 'float',
        name: 'Position Rotation'
    },
    {
        path: 'width',
        type: 'int',
        name: 'Item Width'
    },
    {
        path: 'height',
        type: 'int',
        name: 'Item Height'
    },
    {
        path: 'img',
        type: 'img',
        name: 'Entity Img'
    },
    ]
    tile.type = 'tile';
    tile.solid = false;

    return tile;
};

module.exports = Background;
