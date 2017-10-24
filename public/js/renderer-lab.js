var events = require('events');
var gl = require('./webgl-lab.js');
var World = require('./world.js');
//var audio = require('./audio.js');
var currentLevel;
var pov;
var canvasDim = gl.canvasDimensions;
World.canvasDim = canvasDim;


var step = function() {

    gl.clear();
    var texture = gl.getTexture();
    gl.matrix.setCurrentMatrix(m4.orthographic(0, canvasDim.x, canvasDim.y, 0, -1, 1));
    gl.matrix.translate((canvasDim.x / 2 - pov.x), (canvasDim.y / 2 - pov.y));
    gl.setUpCamera();
    var instances = [];
    var textures = [];
    var dims = [];
    World.getGeometry('square').forEach(function(item, index, array) {
        instances = instances.concat([item.pos.x, item.pos.y, item.pos.rot]);
        textures = textures.concat([
                item.textureData.frame.x / ((texture) ? texture.width : 1), 
                item.textureData.frame.y / ((texture) ? texture.height : 1), 
                item.textureData.frame.w / ((texture) ? texture.width : 1), 
                item.textureData.frame.h / ((texture) ? texture.height : 1)
        ]);
        dims = dims.concat([item.width, item.height]);
    });
    gl.drawSquares(instances, dims, textures);
    instances = [];
    textures = [];
    World.getGeometry('circle').forEach(function(item, index, array) {
        instances = instances.concat([item.pos.x, item.pos.y, item.pos.rot, item.radius]);
        textures = textures.concat([
                (item.textureData.frame.x + (item.pose.x / item.textureData.poses.x) * item.textureData.frame.w) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.y + (item.pose.y / item.textureData.poses.y) * item.textureData.frame.h) / ((texture) ? texture.height : 1), 
                (item.textureData.frame.w / item.textureData.poses.x) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.h / item.textureData.poses.y) / ((texture) ? texture.height : 1)
        ]);
    });
    gl.drawCircles(instances, textures);

};

var api = {
    step: function() {
        if (pov) step();
    },
    connectCamera: function(camera) {
        pov = camera.pos;
    }
};


module.exports = api;
