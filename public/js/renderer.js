var events = require('events');
var gl = require('./webgl.js');
var World = require('./world.js');
//var audio = require('./audio.js');
var currentLevel;
var pov;
var canvasDim = gl.canvasDimensions;
World.canvasDim = canvasDim;


var step = function() {

    gl.clear();
    gl.setUpCamera(pov);
    var texture = gl.getTexture();
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
                (item.textureData.frame.x + (((item.pose) ? item.pose.x : 0) / ((item.textureData.poses) ? item.textureData.poses.x : 1)) * item.textureData.frame.w) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.y + (((item.pose) ? item.pose.y : 0) / ((item.textureData.poses) ? item.textureData.poses.y : 1)) * item.textureData.frame.h) / ((texture) ? texture.height : 1), 
                (item.textureData.frame.w / ((item.textureData.poses) ? item.textureData.poses.x : 1)) / ((texture) ? texture.width : 1), 
                (item.textureData.frame.h / ((item.textureData.poses) ? item.textureData.poses.y : 1)) / ((texture) ? texture.height : 1)
        ]);
    });
    gl.drawCircles(instances, textures);

};

var api = {
    step: function() {
        if (pov && gl.isLoaded()) step();
    },
    connectCamera: function(camera) {
        pov = camera.pos;
    }
};


module.exports = api;
