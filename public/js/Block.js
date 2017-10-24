
/*
var effects = [];
var newEffects = [];
var lineIntersect = function(a,b,c,d,p,q,r,s) {
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};

var polyIntersect = function(verts, point1, point2) {
    var j = verts.length - 1;
    return verts.reduce(function(prev, curr, index, array) {
        if (prev) return true;
        if (lineIntersect(point1.x, point1.y, point2.x, point2.y, curr.x, curr.y, array[j].x, array[j].y)) return true;
        j = index;
    }, false);

};

var perpPoint = function(verts, p) {
    var output = verts.map(function(v0, index, array) {
        var v1 = array[index + 1];
        if (index + 1 === array.length) v1 = array[0];
        var k = ((v1.y - v0.y) * (p.x - v0.x) - (v1.x - v0.x) * (p.y - v0.y)) / (Math.pow(v1.y - v0.y, 2) + Math.pow(v1.x - v0.x, 2));
        var perpPoint = {x: p.x - k * (v1.y - v0.y), y: p.y + k * (v1.x - v0.x)};
        var dis = Math.sqrt(Math.pow(p.x - perpPoint.x, 2) + Math.pow(p.y - perpPoint.y, 2));
        return {dis: dis, perpPoint: perpPoint};
    });
    return output.reduce(function(past, current) { 
        if (!past.dis) return current;
        if (current.dis < past.dis) return current;
        return past;
    }).perpPoint;
};


var setVerts = function(pos, width, height) {

    pos.x = parseInt(pos.x);
    pos.y = parseInt(pos.y);
    pos.rot = parseInt(pos.rot);

    var verts = [
        {x: pos.x - width / 2, y: pos.y - height / 2}, 
        {x: pos.x + width / 2, y: pos.y - height / 2}, 
        {x: pos.x + width / 2, y: pos.y + height / 2}, 
        {x: pos.x - width / 2, y: pos.y + height / 2}, 
    ];

    var rot = pos.rot;
    var ox = pos.x;
    var oy = pos.y;

    return verts.map(function(item) {
        var vx = item.x;
        var vy = item.y;
        item.x = Math.cos(rot) * (vx - ox) - Math.sin(rot) * (vy - oy) + ox;
        item.y = Math.sin(rot) * (vx - ox) + Math.cos(rot) * (vy - oy) + oy;
        return item;
    });

};

var Block = function(options) {

    var i;

    if (!options.img) options.img = 'wall';
    if (!options.height) options.height = 100;
    if (!options.width) options.width = 100;

    var verts = setVerts(options.pos, options.width, options.height);

    var block = {
        resetTexture: function(texture) {
            block.img = texture;
        },
        getProps: function() {
            return {
                pos: block.pos,
                width: block.width,
                height: block.height,
                img: block.imgName
            };
        },
        updateProps: function(props) {
            if (!props) props = {};
            if (props.pos) block.pos = props.pos;
            if (props.width) block.width = parseInt(props.width);
            if (props.height) block.height = parseInt(props.height);
            if (props.img) block.setImage(props.img);
            block.resetVerts();
        },
        vertices: verts,
        setImage: function(name) {
            block.imgName = name;
            block.img = assets.getImg(name);
        },
        geometry: 'block',
        pattern: true,
        type: 'block',
        visible: true,
        solid: true,
        pos: options.pos || {x: 0, y: 0, rot: 0},
        width: options.width || 100,
        height: options.height || 100,
        resetVerts: function() { verts = setVerts(block.pos, block.width, block.height); },
        testPoint: function(point) {
            var result = false;
            if (pointInPolygon(verts, point)) {
                result = perpPoint(verts, point);
            }
            return result;
        },
        collision: {},
        addEffect: function(fn) {
            newEffects.push(fn);
        },
        step: function() {
            effects = effects.filter((function(item) { return item.call(this); }).bind(this));
            effects = effects.concat(newEffects);
            newEffects = [];
            return !this.dis;
        },
        die: false,
        oclude: function(point1, point2) {
            return polyIntersect(verts, point1, point2);
        }
    };

    block.setImage(options.img);

    block.relevantOptions = [
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
        name: 'Entity Img',
        img: block.imgName
    },
    ];

    return block;
};

module.exports = Block;

*/

