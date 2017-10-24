var world = require('./world.js');
var prune = function(a, b) {
    return (
            ((a.AABB.ys[0].val > b.AABB.ys[0].val && a.AABB.ys[0].val < b.AABB.ys[1].val) ||
            (a.AABB.ys[1].val > b.AABB.ys[0].val && a.AABB.ys[1].val < b.AABB.ys[1].val) ||
            (b.AABB.ys[0].val > a.AABB.ys[0].val && b.AABB.ys[0].val < a.AABB.ys[1].val) ||
            (b.AABB.ys[1].val > a.AABB.ys[0].val && b.AABB.ys[1].val < a.AABB.ys[1].val)) && 
            (!(b.geometry === 'square' && a.geometry === 'square')) &&
            (b.id !== a.id)
           );
};

var collision = function() {
    var sweeping = [];
    var possibleXs = [];
    var moves = [];
    world.getXs().forEach(function(x) {
        if (x.type === 'b') {
            sweeping.forEach(function(swept) {
                possibleXs.push([x.obj, swept]);
            });
            sweeping.push(x.obj);
        }
        if (x.type === 'e') {
            sweeping = sweeping.filter(function(swept) {
                if (swept.id !== x.obj.id) return true;
            });
        }
    });

    possibleXs = possibleXs.filter(function(pair) {
        return prune(pair[0], pair[1]);
    });

    possibleXs.forEach(function(pair) {
        pair[0].detectCollide(pair[1]);
    });

};

api = {
    step: function() {
        collision();
    }
};

module.exports = api;

/*
 *
                    if ((collider.type === 'zombie' && collidee.type === 'human') || (collidee.type === 'zombie' && collider.type === 'human')) {
                        if (collider.type === 'zombie') {
                            zombie = collider;
                            human = collidee;
                        } else {
                            zombie = collidee;
                            human = collider;
                        }

                        oclude = world.filter(function(curr) {
                            if (curr.type === 'block') return true;
                            return false;
                        }).reduce(function(prev, curr) { 
                            if (prev) return true;
                            return curr.oclude(collider.pos, collidee.pos);
                        }, false);

                        if (zombie.target === human && oclude && dis > 1000) {
                            zombie.addMode('searching');
                        } else {
                        
                            ang2 = Math.abs(Math.atan2(human.pos.y - zombie.pos.y, human.pos.x - zombie.pos.x));

                            ang =  zombie.pos.rot - ang2;
                            if (!oclude && (Math.abs(ang) < Math.PI * 0.45 || dis < 500)) {
                                zombie.addMode('chasing');
                                zombie.target = human;
                            }
                        }
                    }

                if ((collider.geometry === 'block' && collidee.geometry === 'circle') || (collider.geometry === 'circle' && collidee.geometry === 'block')) {
                    if (collider.geometry === 'block') {
                        block = collider;
                        circle = collidee;
                    }
                    if (collidee.geometry === 'block') {
                        block = collidee;
                        circle = collider;
                    }

                    if (circle.type !== 'goal') {
                        point = block.testPoint(circle.pos);
                        if (point) {
                            if (circle.type === 'clickObj') circle.addObj(block);
                            if (circle.type === 'clickMenu') circle.addObj(block);
                            if (circle.type === 'bullet' && block.type === 'block') circle.die = true;
                            if (block.type === 'sensor' && circle.type === 'activation') block.collision.activation();
                            if (block.solid) {
                                circle.pos.x = point.x;
                                circle.pos.y = point.y;
                            }
                        }
                    }

                }
                    */


