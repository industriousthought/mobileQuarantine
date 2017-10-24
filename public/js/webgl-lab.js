"use strict";
var matrixStack = require('./matrixStack.js');
matrixStack = new matrixStack();

var canvasSpace = {};
canvasSpace.width = 3000;
canvasSpace.height = 1500;

var gl, drawSquares, drawCircles, setUpCamera, texture;
window.addEventListener('load', function() {
    var canvas = document.getElementById('canvas');
    canvas.setAttribute('width', canvasSpace.width);
    canvas.setAttribute('height', canvasSpace.height);
    gl = canvas.getContext('webgl');
    var ext = gl.getExtension("ANGLE_instanced_arrays"); // Vendor prefixes may apply!



    // Get A WebGL context
    /** @type {HTMLCanvasElement} */


    // setup GLSL program
    var circlesProgram = webglUtils.createProgramFromScripts(gl, ["drawCircles-vertex-shader", "drawCircles-fragment-shader"]);
    var squaresProgram = webglUtils.createProgramFromScripts(gl, ["drawSquares-vertex-shader", "drawSquares-fragment-shader"]);

    // look up where the vertex data needs to go.
    var circlePositionLocation = gl.getAttribLocation(circlesProgram, "a_position");
    var circleTexcoordLocation = gl.getAttribLocation(circlesProgram, "a_texcoord");
    var circleInstanceLocation = gl.getAttribLocation(circlesProgram, "a_instance");
    var circleTexturesLocation = gl.getAttribLocation(circlesProgram, "a_pose");
    var squarePositionLocation = gl.getAttribLocation(squaresProgram, "a_position");
    var squareTexcoordLocation = gl.getAttribLocation(squaresProgram, "a_texcoord");
    var squareInstanceLocation = gl.getAttribLocation(squaresProgram, "a_instance");
    var squareTexturesLocation = gl.getAttribLocation(squaresProgram, "a_pose");
    var squareDimsLocation = gl.getAttribLocation(squaresProgram, "a_dim");

    // lookup uniforms
    var circleCameraMatrixLocation = gl.getUniformLocation(circlesProgram, "u_cameraMatrix");
    var circleCanvasDimsLocation = gl.getUniformLocation(circlesProgram, "u_canvasDims");
    var squareCameraMatrixLocation = gl.getUniformLocation(squaresProgram, "u_cameraMatrix");
    var squareCanvasDimsLocation = gl.getUniformLocation(squaresProgram, "u_canvasDims");
    var squareTextureLocation = gl.getUniformLocation(squaresProgram, "u_texture");
    var circleTextureLocation = gl.getUniformLocation(circlesProgram, "u_texture");

    var dimsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dimsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);

    var textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);

    var instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, [0, 0, 0], gl.STATIC_DRAW);
    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [
        -.5, -.5,
        -.5, .5,
        .5, -.5,
        .5, -.5,
        -.5, .5,
        .5, .5
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coords
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Put texcoords in the buffer
    var texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    function loadImageAndCreateTextureInfo(url) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        var textureInfo = {
            width: 1,   // we don't know the size until it loads
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.addEventListener('load', function() {
            textureInfo.width = img.width;
            textureInfo.height = img.height;

            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
        img.src = url;

        return textureInfo;
    };

    texture = loadImageAndCreateTextureInfo('./img/spritesheet.png');

    setUpCamera = function() {
        gl.useProgram(squaresProgram);
        gl.uniformMatrix4fv(squareCameraMatrixLocation, false, matrixStack.getCurrentMatrix());
        gl.uniform2f(squareCanvasDimsLocation, canvasSpace.width, canvasSpace.height);
        gl.useProgram(circlesProgram);
        gl.uniformMatrix4fv(circleCameraMatrixLocation, false, matrixStack.getCurrentMatrix());
        gl.uniform2f(circleCanvasDimsLocation, canvasSpace.width, canvasSpace.height);
    };

    drawSquares = function(instances, dims, textures) {

        gl.useProgram(squaresProgram);

        var instanceCount = instances.length / 3;
        instances = new Float32Array(instances);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances, gl.DYNAMIC_DRAW, 0, instances.length);
        gl.enableVertexAttribArray(squareInstanceLocation);
        gl.vertexAttribPointer(squareInstanceLocation, 3, gl.FLOAT, false, 12, 0);
        ext.vertexAttribDivisorANGLE(squareInstanceLocation, 1); 

        dims = new Float32Array(dims);
        gl.bindBuffer(gl.ARRAY_BUFFER, dimsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dims, gl.DYNAMIC_DRAW, 0, dims.length);
        gl.enableVertexAttribArray(squareDimsLocation);
        gl.vertexAttribPointer(squareDimsLocation, 2, gl.FLOAT, false, 8, 0);
        ext.vertexAttribDivisorANGLE(squareDimsLocation, 1); 

        textures = new Float32Array(textures);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textures, gl.DYNAMIC_DRAW, 0, textures.length);
        gl.enableVertexAttribArray(squareTexturesLocation);
        gl.vertexAttribPointer(squareTexturesLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(squareTexturesLocation, 1); 

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(squarePositionLocation);
        gl.vertexAttribPointer(squarePositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(squareTexcoordLocation);
        gl.vertexAttribPointer(squareTexcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(squareTextureLocation, 0);

        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, instanceCount);

    };

    drawCircles = function(instances, textures) {

        gl.useProgram(circlesProgram);

        var instanceCount = instances.length / 4;
        instances = new Float32Array(instances);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances, gl.DYNAMIC_DRAW, 0, instances.length);
        gl.enableVertexAttribArray(circleInstanceLocation);
        gl.vertexAttribPointer(circleInstanceLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(circleInstanceLocation, 1); 

        textures = new Float32Array(textures);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textures, gl.DYNAMIC_DRAW, 0, textures.length);
        gl.enableVertexAttribArray(circleTexturesLocation);
        gl.vertexAttribPointer(circleTexturesLocation, 4, gl.FLOAT, false, 16, 0);
        ext.vertexAttribDivisorANGLE(circleTexturesLocation, 1); 

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(circlePositionLocation);
        gl.vertexAttribPointer(circlePositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(circleTexcoordLocation);
        gl.vertexAttribPointer(circleTexcoordLocation, 2, gl.FLOAT, false, 0, 0);


        gl.uniform1i(circleTextureLocation, 0);

        
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, instanceCount);

    };
});


module.exports = {
    drawCircles: function() {
        drawCircles.apply(null, arguments);
    },
    drawSquares: function() {
        drawSquares.apply(null, arguments);
    },
    setUpCamera: function() {
        setUpCamera();
    },
    clear: function() {
        gl.viewport(0, 0, canvasSpace.width, canvasSpace.height);

        gl.clear(gl.COLOR_BUFFER_BIT);
    },
    matrix: matrixStack,
    getTexture: function() {
        return texture;
    },
    canvasDimensions: {
        x: canvasSpace.width,
        y: canvasSpace.height
    }
};
