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


var pointInPolygon = function(square, circle) {
    var c = false;
    var i, j, x, y, p;
    var vertices = square.verts;
    var point = circle.pos;

    j = vertices.length - 1;

    for (i = 0; i < vertices.length; i++) {

        if ( ((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
        (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x) ) {
            c = !c;
        }

        j = i;
    }

    if (c) {
        if (square.solid && circle.solid) {
            p = perpPoint(vertices, point);
            //x = p.x - circle.pos.x;
            //y .= p.y - circle.pos.y;
            //circle.addEffect(function() { 
                circle.move({x: p.x, y: p.y}); 
            //});
            circle.collide(square);
            square.collide(circle);
        }
        return true;
    }
};

var longPush = function(a, b) {
    var then = Date.now();
    var x = Math.cos(b.pos.rot) * b.velocity;
    var y = Math.sin(b.pos.rot) * b.velocity;
    a.addEffect(function() {
        var elapsedTime = (Date.now() - then) / 1000;
        var scaler = Math.pow(elapsedTime - 1, 2);
        if (elapsedTime > 1) return false;
        a.push({x: x * scaler, y: y * scaler});

    });
};

var circleDetect = function(a, b) {
    var x, y, dis, radius, delta, theta, aDelta, bDelta;
    x = a.pos.x - b.pos.x;
    y = a.pos.y - b.pos.y;
    dis = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    radius = parseInt(a.radius) + parseInt(b.radius);

    if (dis < radius) {
        if (a.solid && b.solid) {
            delta = (radius - dis);
            theta = Math.atan2(y, x);
            a.addEffect(function() { 
                a.push({
                    x: (Math.cos(theta) * delta), 
                    y: (Math.sin(theta) * delta)
                }); 
                return false;
            });
            b.addEffect(function() { 
                b.push({
                    x: (Math.cos(theta) * -delta),  
                    y: (Math.sin(theta) * -delta)
                }); 
                return false;
            });
            if (b.inertia) longPush(a, b);
            if (a.inertia) longPush(b, a);
            a.collide(b);
            b.collide(a);
        }
        return true;
    }
};

var setAABB = function(obj) {
    var AABB = {
        xs: [{type: 'b', val: Infinity, obj: obj}, {type: 'e', val: -Infinity, obj: obj}],
        ys: [{type: 'b', val: Infinity, obj: obj}, {type: 'e', val: -Infinity, obj: obj}]
    };

    if (obj.geometry === 'circle') {
        AABB.xs[0].val = obj.pos.x - obj.radius;
        AABB.xs[1].val = obj.pos.x + obj.radius;
        AABB.ys[0].val = obj.pos.y - obj.radius;
        AABB.ys[1].val = obj.pos.y + obj.radius;
        obj.AABB = AABB;
        return;
    };
    if (obj.geometry === 'square') {
        obj.AABB = obj.verts.reduce(function(acc, vert) {
            if (vert.x < acc.xs[0].val) acc.xs[0].val = vert.x;
            if (vert.x > acc.xs[1].val) acc.xs[1].val = vert.x;
            if (vert.y < acc.ys[0].val) acc.ys[0].val = vert.y;
            if (vert.y > acc.ys[1].val) acc.ys[1].val = vert.y;
            return acc;
        }, AABB);
    }
};

var setVerts = function(obj) {

    obj.pos.x = parseInt(obj.pos.x);
    obj.pos.y = parseInt(obj.pos.y);

    var verts = [
        {x: obj.pos.x - obj.width / 2, y: obj.pos.y - obj.height / 2}, 
        {x: obj.pos.x + obj.width / 2, y: obj.pos.y - obj.height / 2}, 
        {x: obj.pos.x + obj.width / 2, y: obj.pos.y + obj.height / 2}, 
        {x: obj.pos.x - obj.width / 2, y: obj.pos.y + obj.height / 2}, 
    ];

    var rot = obj.pos.rot;
    var ox = obj.pos.x;
    var oy = obj.pos.y;

    obj.verts = verts.map(function(item) {
        var vx = item.x;
        var vy = item.y;
        item.x = Math.cos(rot) * (vx - ox) - Math.sin(rot) * (vy - oy) + ox;
        item.y = Math.sin(rot) * (vx - ox) + Math.cos(rot) * (vy - oy) + oy;
        return item;
    });

    setAABB(obj);
};

module.exports = function(obj, type) {
    obj.geometry = type;
    if (type === 'circle') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'circle') return circleDetect(obj, collider);
            if (collider.geometry === 'square') return pointInPolygon(collider, obj);
        };
        obj.move({ev: setAABB.bind(null, obj)});
        setAABB(obj);
    }
    if (type === 'square') {
        obj.detectCollide = function(collider) {
            if (collider.geometry === 'square') return false;
            if (collider.geometry === 'circle') return pointInPolygon(obj, collider);
        };
        obj.width = 100;
        obj.height = 100;
        obj.setDimensions = function(dim) {
            if (dim) {
                if (dim.width) obj.width = dim.width;
                if (dim.height) obj.height = dim.height;
                setVerts(obj);
            }
        }
        obj.move({ev: setVerts.bind(null, obj)});
        setVerts(obj);
    }
};
