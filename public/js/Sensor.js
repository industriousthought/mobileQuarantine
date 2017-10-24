var Block = require('./Block.js');

module.exports = function(options) {


    var sensor = Block({path: '', pos: {x: options.pos.x, y: options.pos.y, rot: options.pos.rot}, width: options.width, height: options.height});

    sensor.updateProps();
    sensor.type = 'sensor';
    sensor.visible = false;
    sensor.solid = false;
    sensor.connectedObjs = [];

    var oldGetProps = sensor.getProps;
    var oldUpdateProps = sensor.updateProps;

    sensor.getProps = function() {
        var props = oldGetProps();
        props.connectedObjs = sensor.connectedObjs;
        return props;
    };

    sensor.updateProps = function(props) {
        if (!props) props = {};
        if (props.connectedObjs) sensor.connectedObjs = props.connectedObjs;
        oldUpdateProps(props);
    };

    var activation = function() {
        sensor.connectedObjs.forEach(function(item) {
            item.toggle();
        });
    };

    sensor.relevantOptions = [
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
        path: 'connectedObjects',
        type: 'objs',
        name: 'Connected Objects',
        objList: sensor.connectedObjs
    }
    ];
    sensor.collision.activation = activation;

    return sensor;
    
};


