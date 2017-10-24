var isBrowser = require('../isBrowser');
var Block = require('./Block.js');

var effects = [];
var newEffects = [];
var Car = function(options) {

    if (!options) options = {pos: {}};
    if (!options.carType) options.carType = 1;
    var carType = options.carType;

    var car = Block({
        img: 'car' + options.carType,
        width: options.width || 200,
        height: options.height || 300,
        pos: {
            x: options.pos.x || 0,
            y: options.pos.y || 0,
            rot: options.pos.rot || 0
        },
    });

    car.relevantOptions = [
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
        path: 'carType',
        type: 'int',
        name: 'Car type'
    }
    ];
    car.getProps = function() {
        return {
            pos: car.pos,
            carType: carType
        };
    };
    car.updateProps = function(props) {
        if (!props) props = {};
        if (props.pos) car.pos = props.pos;
        if (props.carType) car.setImage('car' + props.carType);
    };
    car.type = 'car';
    car.pattern = false;

    return car;
};

module.exports = Car;
