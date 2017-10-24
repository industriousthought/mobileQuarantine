(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var events = require('./events.js');
var Character = require('./character.js');

module.exports = function(options) {

    var player = Character({
        pos: options.pos,
        type: 'player',
        mode: 'standing',
        modes: {
            die: function() {
                events.emit('die');
            },
            standing: function() {
                player.pose.y = 0;
                player.velocity = 0;
            },
            running: function() {

            },
            walking: function() {

            },
            shooting: function() {
                player.pose.y = 1;
                if (player.currentWeapons.length === 0) return;
                var coolDown = player.currentWeapons[player.weilding].coolDown;
                var tick = coolDown - 1;
                player.addEffect(function() {
                    if (player.currentMode !== 'shooting') return false;
                    tick++;
                    if (tick > coolDown) { 
                        player.currentWeapons[player.weilding].use();
                        tick = 0;
                    }
                    return true;
                });
            }
        },

        collide: function(collider) {
            switch (collider.base) {
                case 'weapon':
                    if (!collider.inContainer()) player.takeItems(collider);
                    break;

            }

            switch (collider.type) {
                case 'zombie':
                    events.emit('gameOver');
                    console.log('gameoverrrrrr');
                    //player.health -= 0.4;
                    break;
                case 'area': 

                    break;
            }

        }
        
    });
    player.nextWeapon = function() {
        player.weilding++;
        if (weilding === player.currentWeapons.length) weilding = 0;
    };
    player.weilding = 0;
    player.addEffect(function() {
        player.currentWeapons = player.getInventoryByBase('weapon');
        player.currentWeapons.forEach(function(weapon, index) {
            if (weapon.selectWeapon) player.weilding = index;
        });
        return true;
    });


    return player;
};

},{"./character.js":7,"./events.js":13}],2:[function(require,module,exports){
var Character = require('./character.js');

module.exports = function(options) {

    var currentAttractor = false;
    var speed = 1 + Math.random() * 3;

    var zombie = Character({
        type: 'zombie',
        mode: 'wandering',
        pos: options.pos,
        modes: {
            rewandering: function() {
                zombie.addMode('wandering');
            },
            wandering: function() {
                //console.log('wandering');
                //if (Math.random() < 0.05) zombie.audio = 'growl';
                var timeLength = 1 + parseInt(Math.random() * 3 * 1000);
                var startTime = Date.now();
                var randomSpeed = Math.random() * 2;
                zombie.pos.rot = Math.random() * Math.PI * 2;
                zombie.pose.y = 1;

                zombie.addEffect(function() {
                    var now = Date.now();
                    if (zombie.currentMode !== 'wandering') {
                        return false;
                    }
                    if (startTime + timeLength < now) {
                        zombie.addMode('rewandering');
                        return false; 
                    }
                    zombie.push({x: Math.cos(zombie.pos.rot) * randomSpeed, y: Math.sin(zombie.pos.rot) * randomSpeed});
                    return true;
                });
            },
            searching: function() {
            },
            chasing: function() {
                zombie.addEffect(function() {
                    var theta = zombie.lookAtObj(currentAttractor);
                    if (zombie.currentMode !== 'chasing' || !currentAttractor) {
                        return false;
                    }
                    zombie.push({x: Math.cos(theta) * speed / 2, y: Math.sin(theta) * speed / 2});
                    return true;
                });
            },
            running: function() {
            },
            biting: function() {
            },
            staggering: function() {
            },
            die: function() {
                zombie.unload();
            }
        },
        collide: function(collider) {
            switch (collider.type) {
                case 'bullet':
                case 'meelee':
                    zombie.health -= collider.power / 100;
                    break;
            }
        }
    });

    zombie.step(function() {
        currentAttractor = world.getItemsByType('player')[0];
        if (currentAttractor) {
            zombie.addMode('chasing');
        } else {
            zombie.addMode('wandering');
        }
    });

    return zombie;
};

},{"./character.js":7}],3:[function(require,module,exports){
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                                       timeToCall);
                                       lastTime = currTime + timeToCall;
                                       return id;
        };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
}());

},{}],4:[function(require,module,exports){
var getId = require('./getId.js').getId;
var square = require('./square.js');
var makeSolid = require('./makeSolid.js');

module.exports = function(options) {
    var objEvents = [];
    var area = square(options);
    area.onTop = true;
    area.type = 'area';
    area.playerMessage = '';
    area.addObjEvent = function(trigger, verb, noun) {
        var id = getId();
        objEvents.push({id: id, trigger: trigger, verb: verb, noun: noun});
        return id;
    };
    area.deleteObjEvent = function(id) {
        objEvents = objEvents.filter(function(item) { return (item.id !== id); });
    };
    area.getObjEvent = function(id) {
        if (id) return objEvents.filter(function(item) { if (item.id = id) return true; })[0];
        return objEvents;
    };
    area.collide = function(collider) {
        objEvents.forEach(function(item) {
            if (item.trigger === collider.type || item.trigger === collider.base) {
                world.getObjByName(item.noun).verbs[item.verb]();
            }
        });
    };

    return area;
};

},{"./getId.js":16,"./makeSolid.js":22,"./square.js":31}],5:[function(require,module,exports){
var getId = require('./getId.js').getId;


module.exports = function() {
    var pushEvents = [];
    var moveEvents = [];
    var loadEvents = [];
    var unloadEvents = [];
    var stepEvents = [];
    var loaded = false;
    var objName = false;
    var moved = false;
    var newEffects = [];
    var effects = [];
    var obj = {
        inContainer: function() {
            return (!!obj.owner);
        },
        setObjName: function(name) {
            objName = name;
        },
        getObjName: function() {
            return objName;
        },
        load: function() {
            var args = [].slice.call(arguments);
            if (args.length) {
                if (loaded) {
                    args.forEach(function(e) { e(); });
                } else {
                    loadEvents = args.concat(loadEvents);
                }
                return;
            }
            if (!loaded) {
                loadEvents.forEach(function(e) { e(); });
                loaded = true;
            }
        },
        unload: function() {
            var args = [].slice.call(arguments);
            if (args.length > 0) return unloadEvents = args.concat(unloadEvents);
            unloadEvents.forEach(function(e) { e(); });
            world.deleteItem(obj.id);
            if (obj.owner) obj.owner.dropItem(obj);
        },
        step: function() {
            var args = [].slice.call(arguments);
            if (args.length > 0) return stepEvents = args.concat(stepEvents);
            stepEvents.forEach(function(e) { e(); });
            effects = effects.concat(newEffects);
            newEffects = [];
            effects = effects.filter(function(item) { return item.call(obj); });
            if (moved) obj.processMovementEvents();
            if (obj.pos.rot > Math.PI * 2) obj.pos.rot -= Math.PI * 2;
            if (obj.pos.rot < 0) obj.pos.rot += Math.PI * 2;

        },
        processMovementEvents: function() {
            obj.velocity = Math.sqrt(obj.pos.vec.x * obj.pos.vec.x + obj.pos.vec.y * obj.pos.vec.y);
            if (obj.velocity > 30) {
                //debugger;
                obj.pos.vec.x = obj.pos.vec.x / (obj.velocity / 30);
                obj.pos.vec.y = obj.pos.vec.y / (obj.velocity / 30);
                obj.velocity = 30;
            }
            obj.pos.x += obj.pos.vec.x;
            obj.pos.y += obj.pos.vec.y;
            if (obj.owner) {
                obj.move(obj.owner.pos);
            }
            obj.pos.vec.x = 0;
            obj.pos.vec.y = 0;
            moveEvents.forEach(function(fn) { fn(); });
            moved = false;
        },
        id: getId(),
        pos: {
            x: 0,
            y: 0,
            rot: 0,
            vec: {
                x: 0,
                y: 0
            }
        },
        move: function(pos) {
            if (pos.ev) {
                moveEvents.push(pos.ev);
            }
            if (pos.x) obj.pos.x = pos.x;
            if (pos.y) obj.pos.y = pos.y;
            if (pos.rot) obj.pos.rot = pos.rot;
            moved = true;
        },
        push: function(vec) {
            if (vec.ev) {
                moveEvents.push(vec.ev);
            }
            if (vec.x) obj.pos.vec.x += vec.x;
            if (vec.y) obj.pos.vec.y += vec.y;
            moved = true;
        },
        addEffect: function(fn) {
            newEffects.push(fn);
        }
    };


    return obj;
};


},{"./getId.js":16}],6:[function(require,module,exports){
var projectile = require('./projectile.js');
var makeSolid = require('./makeSolid.js');

var Bullet = function(options) {

    var bullet = projectile();

    bullet.fire = function(pos) {
        var distance = 0;
        var theta = pos.rot;
        bullet.inertia = true;
        bullet.pos.rot = pos.rot;
        bullet.onTop = true;
        bullet.velocity = 25;
        makeSolid(bullet);
        bullet.step(function() {
            if (bullet.die || distance > bullet.range) bullet.unload();
            distance++;
            bullet.push({x: Math.cos(theta) * bullet.velocity, y: Math.sin(theta) * bullet.velocity});
        });
        bullet.radius = 1;
        bullet.collide = function(collider){
            switch (collider.type) {
                case 'zombie':
                    bullet.unload();
                    break;
            }
            switch (collider.base) {
                case 'square':
                    bullet.unload();
                    break;
            }
        }
        bullet.move({x: pos.x + Math.cos(theta) * 75, y: pos.y + Math.sin(theta) * 75});
    };

    for (var key in options) {
        bullet[key] = options[key];
    }

    bullet.type = 'bullet';
    return bullet;
};




module.exports = Bullet;

},{"./makeSolid.js":22,"./projectile.js":27}],7:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeInventory = require('./makeInventory.js');
var makeSolid = require('./makeSolid.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function(options) {
    var character = baseEntity();
    var aniTick = 0;
    makeInventory(character);
    makeGeometry(character, 'circle');
    makeSolid(character);
    makeVisible(character);
    character.radius = 50;
    character.solid = true;
    character.onTop = true;
    character.geometry = 'circle';
    character.lookAtVec = function(vec) {
        var theta = Math.atan2(vec.y, vec.x);
        character.pos.rot = theta + Math.PI;
        return theta;
    };
    character.lookAtObj = function(obj) {
        var theta = Math.atan2(obj.pos.y - character.pos.y, obj.pos.x - character.pos.x);
        character.pos.rot = theta;
        return theta;
    };
    character.base = 'character';
    character.health = 1;
    character.step(function() {
        if (character.health <= 0) character.addMode('die');
        aniTick++;
        if (!character.velocity) {
            character.pose.x = 0;
        } else {
            if (aniTick > 16 - character.velocity) {
                aniTick = 0;
                if (character.pose.x < character.textureData.poses.slides[character.pose.y] - 1) {
                    character.pose.x++;
                } else {
                    character.pose.x = 0;
                }
            } else {
                aniTick++;
            }
        }
    });
    character.modes = options.modes;
    character.collide = options.collide;
    character.type = options.type;
    character.addMode = function(mode) {
        if (character.currentMode === mode) return;
        character.currentMode = mode;
        character.modes[mode]();
    };
    character.pose = {x: 0, y: 0};
    character.load(function() { character.addMode(options.mode); });
    character.move(options.pos);
    return character;
};


},{"./baseEntity.js":5,"./makeGeometry.js":19,"./makeInventory.js":21,"./makeSolid.js":22,"./makeVisible.js":24}],8:[function(require,module,exports){
document.oncontextmenu = function() { return false; }
var loaded = false;
var events = require('./events.js');
var getId = require('./getId.js').getId;
var effects = require('./effects.js');
var objs = {};
var menus = {};
var inputs = {};
window.functions = {};
var menuCloseEvents = {};
var loadEvents = [];
var canvases = {};
var oldWeapons = [];
var iconEvents = [];
var weaponIcons = [];


window.onload = function() { 
    [].slice.call(document.getElementsByClassName('menus')).forEach(function(obj, index, array) { 
        menus[obj.id] = obj; 
        effects.fadeOut(obj);
    });
    [].slice.call(document.getElementsByClassName('domobj')).forEach(function(obj, index, array) { 
        objs[obj.id] = obj; 
    });
    [].slice.call(document.getElementsByTagName('input')).forEach(function(obj, index, array) { 
        inputs[obj.id] = obj; 
    });
    //objs['modalAck'].addEventListener('click', function() { effects.fadeOut(objs['modal']); });
    objs['window'] = window;
    loaded = true; 
    loadEvents.forEach(function(ev) { ev(); }); 
};

var ensureObjId = function(obj) {
    if (obj.id) return obj.id;
    obj.id = getId();
    objs[obj.id] = obj;
    return obj.id;
};

var resetCanvas = function(canvas) {
    var canvasWidth = canvas.getAttribute('width');
    var canvasHeight = canvas.getAttribute('height');
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    if (canvasWidth / canvasHeight > screenWidth / screenHeight) {
        canvas.style.width = screenWidth + 'px';
        canvas.style.height = screenWidth * (canvasHeight / canvasWidth) + 'px';
        canvas.style.top = (screenHeight - (screenWidth * (canvasHeight / canvasWidth))) / 2 + 'px';
        canvas.style.left = '0px'; 
    } else {
        canvas.style.height = screenHeight + 'px';
        canvas.style.width = screenHeight * (canvasWidth / canvasHeight) + 'px';
        canvas.style.left = (screenWidth - (screenHeight * (canvasWidth / canvasHeight))) / 2 + 'px';
        canvas.style.top = '0px'; 
    }
};



var api = {
    setCanvas: function(id, dim) {
        if (dim) {
            objs[id].setAttribute('width', dim.width);
            objs[id].setAttribute('height', dim.height);
            if (!canvases[id]) {
                canvases[id] = objs[id];
                resetCanvas(objs[id]);
                api.attachEvent('window', 'resize', resetCanvas.bind(null, objs[id]));
            } 
        }
        return objs[id].getContext('webgl');
    },
    clearInputs: function(ancestor) {
        ancestor = api.getObjById(ancestor);
        for (var input in inputs) {
            if (ancestor.contains(inputs[input])) inputs[input].value = '';
        }
    },
    onHideMenu: function(id, func) {
        if (!menuCloseEvents[id]) menuCloseEvents[id] = [];
        menuCloseEvents[id].push(func);
    },
    hideMenu: function(id) {
        if (id) {
            effects.fadeOut(menus[id]);
            if (menuCloseEvents[id]) {
                menuCloseEvents[id].forEach(function(f) { f(); });
                menuCloseEvents[id] = [];
            }
            return;
        }
        for (var menu in menus) {
            if (menus[menu].id !== 'worldInspector') {
                effects.fadeOut(menus[menu]);
                if (menuCloseEvents[menu]) {
                    menuCloseEvents[menu].forEach(function(f) { f(); });
                    menuCloseEvents[menu] = [];
                }
            }
        }
    },
    showMenu: function(id, pos) {
        effects.fadeIn(menus[id]);
        if (pos) {
            menus[id].style.left = parseInt(pos.x - 20) + 'px';
            menus[id].style.top = parseInt(pos.y - 20) + 'px';
        }
    },
    getItemsByClass: function(c) {
        return [].slice.call(document.getElementsByClassName(c)).map(function(item) {
            return item.id;
        });;
    },
    addListItem: function(ul, li) {
        objs[ul].appendChild(objs[li]);
    },
    addMenuListItem: function(id, text, click, mouseover) {
        var li = document.createElement('li');
        var span = document.createElement('span');
        ensureObjId(li);
        span.innerText = text;
        li.appendChild(span);
        if (click) span.addEventListener('click', click);
        if (mouseover) span.addEventListener('mouseover', mouseover);
        objs[id].appendChild(li);
        return li.id;
    },
    clearListItems: function(id) {
        [].slice.call(objs[id].children).forEach(function(child) {
           if (!child.className.split(' ').reduce(function(a, b) {
                if (a) return true;
                if (b === 'listItem') return true;
                return false;
           }, false)) objs[id].removeChild(child);
        });
    },
    getInputsValues: function(ancestor) {
        return [].slice.call(document.getElementsByTagName('select')).
            concat([].slice.call(document.getElementsByTagName('input'))).
            filter(function(item) {
                return (objs[ancestor].contains(item));
            }).map(function(item) {
                return {id: item.id, value: item.value};
            });
    },
    onload: function(ev) {
        if (loaded) return ev();
        loadEvents.push(ev);
    },
    getGenericListItem: function() {
        return document.getElementsByClassName('genericListItem')[0].cloneNode(true);
    },
    attachEvent: function(id, type, func) {
        if (id.cloneNode) id = ensureObjId(id);
        var fid = getId();
        functions[fid] = {f: func, id: id, type: type};
        api.onload(function() { 
            objs[id].addEventListener(type, func); 
        });
        return fid;
    },
    detachEvent: function(fid) {
        var ev = functions[fid];
        if (objs[ev.id].removeEventListener) objs[ev.id].removeEventListener(ev.type, ev.f);
        delete functions[fid];
    },
    display: function(id) {
        [].slice.call(document.getElementsByClassName('slides')).forEach(function(obj) { effects.fadeOut(obj); });
        effects.fadeIn(objs[id]);
    },
    getObjById: function(id) {
        return objs[id];
    },
    getGenericButton: function(text, click, mouseover) {
        var button = document.createElement('button');
        button.innerText = text;
        if (click) button.addEventListener('click', click);
        if (mouseover) button.addEventListener('mouseover', mouseover);
        return button;
    },
    modal: function(msg) {
        api.getObjById('modalMsg').innerText = msg;
        effects.fadeIn(api.getObjById('modal'));
    },
    updateWeaponIcons: function(weapons) {
        var changed;
        if (weapons) {
            weapons.forEach(function(weapon) {
                if (weapons.type !== oldWeapons.type) changed = true;
            });
            if (changed) {
                oldWeapons = weapons;
                weaponIcons.forEach(function(icon) {
                    weaponIcons[index].style.backgroundImage = '';
                });
                iconEvents.forEach(function(ev) {
                    ev.dom.removeEventListener(ev.func);
                });
                weapons.forEach(function(weapon, index) {
                    var click = function() {
                        weapon.selectWeapon = true;
                    };
                    weaponIcons[index].style.backgroundImage = weapon.icon;
                    iconEvents.push({dom: weaponIcons[index], func: click});
                    weaponIcons.addEventListener('click', click);
                });
            }
        }
    }
};

for (var i = 0; i < 4; i++) {
    weaponIcons.push(document.createElement('li'));
    weaponIcons[i].className = 'weaponicon';
    (function() { 
        var j = i;
        if (objs['weaponOptions']) api.onload(function() { 
            objs['weaponOptions'].appendChild(weaponIcons[j]); 
        });
    })();
}
module.exports = api;

},{"./effects.js":12,"./events.js":13,"./getId.js":16}],9:[function(require,module,exports){
var wall = require('./wall.js');
var makeStartOptions = require('./makeStartOptions.js');

module.exports = function(options) {
    var door = wall(options);
    makeStartOptions(door);
    door.startOptions({speed: options.speed});
    door.type = 'door';
    door.openPos = options.openPos || options.pos;
    door.closePos = options.closePos || options.pos;
    door.opened = options.opened || true;

    var progress = (door.opened) ? 1 : 0;
    var startTime;
    var updatePos = function(toggle) {
        if (toggle) progress = (door.opened) ? 1 : 0;
        door.move({
            x: door.openPos.x + (door.closePos.x - door.openPos.x) * progress,
            y: door.openPos.y + (door.closePos.y - door.openPos.y) * progress,
            rot: door.openPos.rot + (door.closePos.rot - door.openPos.rot) * progress
        });
    };

    door.updatePos = updatePos;

    updatePos();

    if (!door.verbs) door.verbs = {};
    door.verbs.open = function() {
        if (door.opened) {
            door.opened = false;
            door.addEffect(function() {
                progress -= options.speed;
                if (progress < 0) progress = 0;
                updatePos();
                return (progress && !door.opened);
            });
        } else {
            door.opened = true;
            door.addEffect(function() {
                progress += options.speed;
                if (progress > 1) progress = 1;
                updatePos();
                return (progress - 1 && door.opened);
            });
        }
    };

    return door;
};


},{"./makeStartOptions.js":23,"./wall.js":35}],10:[function(require,module,exports){
var makeStartOptions = require('./makeStartOptions.js');
var post = require('./post.js');
var testObj = require('./test-obj.js');
var world = require('./world.js');
var canvas = document.getElementById('canvas');
var getId = require('./getId.js').getId;
var events = require('./events.js');
var dom = require('./dom.js');
var editingObj = false;
var draggingObj = false;
var worldInspectorFids = [];
var clickObj = {};
var camera = testObj({pos: {
    x: 1000,
    y: 1000
}});
camera.camera = true;
camera.load();
camera.step();

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
};

var screenWidth = canvas.clientWidth;
var screenHeight = canvas.clientHeight;
var mousePos = {x: 0, y: 0};
var menuItems = {
    type: {
        door: [],
        area: []
    },
    geometry: {
        square: [],
        circle: []
    },
    base: {
        spawner: []
    }
};

var state = 'noMenus';
var states = {
    noMenus: function() {
        dom.hideMenu();
    },
    editingObj: function(ev, obj) {
        if (!obj) obj = clickObj;
        dom.hideMenu();
        dom.clearInputs('objInspector');
        dom.clearListItems('objInspector');
        editingObj = obj;
        updateObjInspectorOptions();
        dom.showMenu('objInspector');
        updateObjInspector();
        focusOnEditingObj();
        dom.onHideMenu('objInspector', function() { editingObj = null; });
    },
    levelMenu: function(gamePos, canvasPos) {
        dom.hideMenu();
        dom.showMenu('levelMenu', canvasPos);
        dom.clearListItems('levelMenuObjs');
        var fid = dom.attachEvent('levelMenu', 'mouseout', function(ev) {
            if (dom.getObjById('levelMenu').contains(ev.toElement)) return;
            updateState('noMenus');
        });
        dom.onHideMenu('levelMenu', function() { dom.detachEvent(fid); });
        getCollidingObjs(clickObj).forEach(function(item) {
            dom.addMenuListItem('levelMenuObjs', (item.type + '  ' + item.id), function(ev) {
                dom.hideMenu('levelMenu');
                updateState('editingObj', ev, item);
            }, function(ev) {
                
            });
        });
    }
};


var updateState = function(newState) {
    state = newState;
    states[state].apply(null, [].slice.call(arguments, 1));
};

var getCollidingObjs = function(testObj) {
    return world.getItems().filter(function(obj) {
        return (obj.detectCollide(testObj));
    });
};

var updateObjInspector = function() {
    if (!editingObj) return;
    dom.getObjById('objType').value = editingObj.type;
    dom.getObjById('objName').value = editingObj.getObjName();
    dom.getObjById('objXPos').value = editingObj.pos.x;
    dom.getObjById('objYPos').value = editingObj.pos.y;
    dom.getObjById('objRotation').value = editingObj.pos.rot;
    if (editingObj.radius) dom.getObjById('objRadius').value = editingObj.radius;
    if (editingObj.width) {
        dom.getObjById('objWidth').value = editingObj.width;
        dom.getObjById('objHeight').value = editingObj.height;
    }
    if (editingObj.base === 'spawner') {
        dom.getObjById('objStart').value = editingObj.startOptions().start;
        dom.getObjById('objInterval').value = editingObj.startOptions().interval;
        dom.getObjById('objSpawnCount').value = editingObj.startOptions().spawnCount;
    }
    if (editingObj.type === 'door') {
        dom.getObjById('objSpeed').value = editingObj.startOptions().speed;
        dom.getObjById('objClosePosX').value = editingObj.closePos.x;
        dom.getObjById('objClosePosY').value = editingObj.closePos.y;
        dom.getObjById('objClosePosRot').value = editingObj.closePos.rot;
        dom.getObjById('objOpenPosX').value = editingObj.openPos.x;
        dom.getObjById('objOpenPosY').value = editingObj.openPos.y;
        dom.getObjById('objOpenPosRot').value = editingObj.openPos.rot;
    }
    if (editingObj.type === 'area') {
        dom.clearListItems('existingTriggersList');
        editingObj.getObjEvent().forEach(function(item) {
            var li = dom.getGenericListItem();
            li.innerText = item.trigger + ' - ' + item.nown + ' - ' + item.verb;
            li.appendChild(dom.getGenericButton('X', function() {
                editingObj.deleteObjEvent(item.id);
                updateObjInspector();
            }, function() {}));
            dom.getObjById('existingTriggersList').appendChild(li);
        });
    }
};

var updateObjInspectorOptions = function() {
    if (editingObj.base === 'spawner') menuItems.base.spawner.forEach(function(item) {
        dom.addListItem('objInspector', item);
    });
    if (editingObj.geometry) menuItems.geometry[editingObj.geometry].forEach(function(item) {
        dom.addListItem('objInspector', item);
    });
    if (editingObj.type === 'door') menuItems.type.door.forEach(function(item) {
        dom.addListItem('objInspector', item);
    });
    if (editingObj.type === 'area') menuItems.type.area.forEach(function(item) {
        dom.addListItem('objInspector', item);
    });
};

var updateEditingObj = function() {
    if (!editingObj) return;
    var values = {};
    dom.getInputsValues('objInspector').forEach(function(item) {
        values[item.id] = item.value;
    });
    var newObj;
    if (values.objType !== editingObj.type) {
        newObj = world.loadItems({
            entity: values.objType,
            pos: {
                x: editingObj.pos.x,
                y: editingObj.pos.y
            }
        });
        editingObj.unload();
        editingObj = newObj;
        dom.clearListItems('objInspector');
        world.updateNewItems();
        updateObjInspectorOptions();
        updateObjInspector();
        values = {};
        dom.getInputsValues('objInspector').forEach(function(item) {
            values[item.id] = item.value;
        });
    }
    if (editingObj.type !== 'door') editingObj.move({x: parseInt(values.objXPos), y: parseInt(values.objYPos), rot: parseFloat(values.objRotation)});
    if (values.objName) editingObj.setObjName(values.objName);
    if (values.objRadius) editingObj.radius = parseInt(values.objRadius);
    if (values.objWidth) editingObj.setDimensions({width: values.objWidth, height: values.objHeight});
    if (editingObj.base === 'spawner') editingObj.startOptions({
        start: values.objStart,
        interval: values.objInterval,
        spawnCount: values.objSpawnCount
    });
    if (editingObj.type === 'door') {
        editingObj.closePos = {x: parseInt(values.objClosePosX), y: parseInt(values.objClosePosY), rot: parseFloat(values.objClosePosRot)};
        editingObj.openPos = {x: parseInt(values.objOpenPosX), y: parseInt(values.objOpenPosY), rot: parseFloat(values.objOpenPosRot)};
        editingObj.opened = values.objOpened;
        editingObj.startOptions({ speed: values.objSpeed });
        editingObj.updatePos();
    }
    if (editingObj.type === 'area') {

    }

    editingObj.processMovementEvents();
};

var deleteEditingObj = function() {
    editingObj.unload();
    updateState('noMenus');
};

var cloneEditingObj = function() {
    var newObj = world.loadItems({
        entity: editingObj.type,
        pos: {
            x: editingObj.pos.x, 
            y: editingObj.pos.y,
            rot: editingObj.pos.rot
        },
        width: editingObj.width,
        height: editingObj.height
    });
    if (editingObj.startOptions) {
        newObj.startOptions(editingObj.startOptions());
    }
    world.updateNewItems();
    newObj.processMovementEvents();
    newObj.load();
};

var translatePosition = function(pos) {
    var canvasPos = {
        x: pos.x * (world.canvasDim.x / screenWidth),
        y: pos.y * (world.canvasDim.y / screenHeight)
    };
    var gamePos = {
        x: canvasPos.x - (world.canvasDim.x / 2 - camera.pos.x),
        y: canvasPos.y - (world.canvasDim.y / 2 - camera.pos.y)
    }
    return gamePos;
};

var canvasClick = function(ev) {
    //ev.preventDefault();
    pauseEvent(ev);
    var startMousePos = {x: ev.clientX, y: ev.clientY};
    var startGamePos = translatePosition(startMousePos);
    var startObjPos;
    clickObj = testObj({pos: startGamePos});
    clickObj.load();
    clickObj.step();
    if (ev.button === 2) updateState('levelMenu', startGamePos, {x: ev.clientX, y: ev.clientY});
    if (ev.button === 0) {
        if (editingObj && getCollidingObjs(clickObj).filter(function(item) { return (item.id === editingObj.id); }).length) {
            draggingObj = editingObj;
        } else {
            draggingObj = api.camera;
        }
        startObjPos = {x: draggingObj.pos.x, y: draggingObj.pos.y};
        var mousemoveFid = dom.attachEvent('window', 'mousemove', function(ev) {
            pauseEvent(ev);
            var gamePos = translatePosition({x: ev.clientX, y: ev.clientY});
            var gamePosDelta = {x: (gamePos.x - startGamePos.x), y: (gamePos.y - startGamePos.y)};
            if (draggingObj.camera) {
                draggingObj.move({x:  (startObjPos.x - gamePosDelta.x), y:  (startObjPos.y - gamePosDelta.y)});
                startObjPos = {x: draggingObj.pos.x, y: draggingObj.pos.y};
                startGamePos = gamePos;
            } else {
                draggingObj.move({x: startObjPos.x + gamePosDelta.x, y: startObjPos.y + gamePosDelta.y});
            }
            draggingObj.processMovementEvents();
            updateObjInspector();
        });
        var mouseupFid = dom.attachEvent('window', 'mouseup', function() {
            dom.detachEvent(mousemoveFid);
            dom.detachEvent(mouseupFid);
            draggingObj = false;
        });
    }
};

var updateWorldInspector = function() {
    dom.getObjById('entityCount').innerText = world.getItems().length;
    dom.clearListItems('worldInspector');
    worldInspectorFids.forEach(function(fid) { dom.detachEvent(fid); });
    worldInspectorFids = [];
    world.getItems().forEach(function(entity) {
        var li = dom.getGenericListItem();
        li.innerText = entity.base + ', ' + entity.type + ', ' + entity.id;
        worldInspectorFids.push(dom.attachEvent(li, 'click', function(ev) {
            updateState('editingObj', ev, entity);
        }));
        dom.addListItem('worldInspector', li.id);
    });
};

var focusOnEditingObj = function() {
    camera.move(editingObj.pos);
};

var saveLevel = function() {
    var output = [];
    world.getItems().forEach(function(item) {
        output.push(item.getInitialConditions());
    });
    post('./levels/', {
        data: JSON.stringify(output),
        name: world.getLevelMetadata().name,
        id: world.getLevelMetadata().id
    }, function(response) {
        dom.modal(JSON.stringify(response));
        world.setLevelMetadata(response);
    });
    updateState('noMenus');
};

var updateLevelName = function() {
    dom.getObjById('levelName').value = world.getLevelMetadata().name;
};


var levelNameInputChanged = function() {
    world.setLevelMetadata({name: dom.getInputsValues('levelName')[0].value});
};

var addTrigger = function() {

};

dom.attachEvent('canvas', 'mousedown', canvasClick);
dom.attachEvent('newLevel', 'click', events.emit.bind(null, 'newLevel'));
dom.attachEvent('newObject', 'click', updateState.bind(null, 'editingObj'));
dom.attachEvent('cloneObj', 'click', cloneEditingObj);
dom.attachEvent('deleteObj', 'click', deleteEditingObj);
dom.attachEvent('focusObj', 'click', focusOnEditingObj);
dom.attachEvent('levelName', 'change', levelNameInputChanged);
dom.attachEvent('saveLevel', 'click', saveLevel);
dom.attachEvent('addTriggerButton', 'click', addTrigger);
dom.attachEvent('mainMenuButton', 'click', events.emit.bind(null, 'mainMenu'));
dom.onload(function() {
    dom.showMenu('worldInspector');
    world.getEntityTypes().forEach(function(type) {
        var val = document.createElement('option');
        val.innerText = type;
        dom.getObjById('objType').appendChild(val);
    });
    dom.getItemsByClass('doorType').forEach(function(item) {
        menuItems.type.door.push(item);
    });
    dom.getItemsByClass('areaType').forEach(function(item) {
        menuItems.type.area.push(item);
    });
    dom.getItemsByClass('circleGeometry').forEach(function(item) {
        menuItems.geometry.circle.push(item);
    });
    dom.getItemsByClass('squareGeometry').forEach(function(item) {
        menuItems.geometry.square.push(item);
    });
    dom.getItemsByClass('spawnerBase').forEach(function(item) {
        menuItems.base.spawner.push(item);
    });
    dom.getInputsValues('objInspector').forEach(function(item) {
        dom.attachEvent(item.id, 'change', updateEditingObj);
    });
});

events.register('entityCount', updateWorldInspector, getId());
events.register('updateLevelName', updateLevelName, getId());

api = {
    camera: camera
};

updateState(state);

module.exports = api;

},{"./dom.js":8,"./events.js":13,"./getId.js":16,"./makeStartOptions.js":23,"./post.js":26,"./test-obj.js":33,"./world.js":38}],11:[function(require,module,exports){
require('./animationShim.js');
var post = require('./post.js');
window.logging = [];
var events = require('./events.js');
var makeInitialConditionsSavable = require('./makeInitialConditionsSavable.js');
var dom = require('./dom.js');
var renderer = require('./renderer.js');
window.world = require('./world.js');
var getId = require('./getId.js').getId;
var controller = require('./editor-controller.js');
var get = require('./get.js');
window.u_id = '';

get('./id', function(data) {
    u_id = data._id;
});

dom.onload(function() {

    renderer.connectCamera(controller.camera);
    var currentGameId = getId();
    world.decorateAllItems(makeInitialConditionsSavable);

    var states = {
        mainMenu: function() {
            dom.display('mainMenu');
            dom.clearListItems('ownerLevels');
            dom.clearListItems('publicLevels');
            get('./levels/', function(data) {
                data.forEach(function(level) {
                    var list = 'ownerLevels';
                    if (level.snapshot) list = 'publicLevels';
                    var li = dom.addMenuListItem(list, level.name, function() {
                        states.loadLevel(level.id);
                    });
                    if (!level.snapshot) dom.getObjById(li).appendChild(dom.getGenericButton('delete', function() {
                        post('./levels/delete/', {
                            levelId: level.id
                        }, function(data) {
                            states.mainMenu();
                        });
                    }));
                    if (!level.snapshot) dom.getObjById(li).appendChild(dom.getGenericButton('publish', function() {
                        post('./levels/publish/', {
                            levelId: level.id
                        }, function(data) {
                            states.mainMenu();
                        });
                    }));
                });
            });
        },
        newLevel: function() {
            world.unloadWorld();
            states.editingLevel();
        },
        loadLevel: function(id) {
            world.loadLevel(id, function() {
                states.editingLevel();
            });
        },
        editingLevel: function() {
            dom.display('gameView');
            events.register('animate', function() {
                renderer.step();
            }, currentGameId);
        },
        pausedLevel: function() {
            dom.display('pauseMenu');
            events.unregister(currentGameId);
            currentGameId = getId();
        }
    };

    
    events.register('newLevel', states.newLevel, getId());
    events.register('start', states.editingLevel, getId());

    events.register('pause', states.pausedLevel, getId());

    events.register('mainMenu', states.mainMenu, getId());
    states.mainMenu();

});







},{"./animationShim.js":3,"./dom.js":8,"./editor-controller.js":10,"./events.js":13,"./get.js":14,"./getId.js":16,"./makeInitialConditionsSavable.js":20,"./post.js":26,"./renderer.js":28,"./world.js":38}],12:[function(require,module,exports){
module.exports = {
    fadeIn: function(obj) {
        obj.style.opacity = 1;
        obj.style.zIndex = 3;
        obj.style.display = 'inherit';
    },
    fadeOut: function(obj) {
        obj.style.opacity = 0;
        obj.style.zIndex = 1;
        obj.style.display = 'none';
    }
};

},{}],13:[function(require,module,exports){
var events = {};

var api = {
    emit: function(e) {
        for (var id in events) {
            if (events[id].e === e) events[id].f();
        }
    },
    register: function(e, f, id) {
        //console.log('registering event ' + e, f, id);
        events[id] = {
            f: f,
            e: e
        };
    },
    unregister: function(id) {
        delete events[id];
    }
};

module.exports = api;

var animate = function() {
    api.emit('animate');
    window.requestAnimationFrame(animate);
};
if (typeof window !== 'undefined') animate();

},{}],14:[function(require,module,exports){

module.exports = function(url, callback) {
    var http = new XMLHttpRequest();

    http.open('GET', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        var data;
        if((http.readyState === 4) && http.status === 200) {
            if (/^[\],:{}\s]*$/.test(http.responseText.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                data = JSON.parse(http.responseText);
            } else {
                data = http.responseText;
            }
            callback(data)
        }
    };
    http.send();

};


},{}],15:[function(require,module,exports){
var Entities = {};

Entities['player'] = require('./Player.js');
Entities['test'] = require('./test-obj.js');
Entities['gun'] = require('./gun.js');
Entities['tile'] = require('./square.js');
Entities['zombieSpawner'] = require('./spawner.js');
Entities['zombie'] = require('./Zombie.js');
Entities['wall'] = require('./wall.js');
Entities['door'] = require('./door.js');
Entities['area'] = require('./area.js');

module.exports = Entities;

},{"./Player.js":1,"./Zombie.js":2,"./area.js":4,"./door.js":9,"./gun.js":17,"./spawner.js":29,"./square.js":31,"./test-obj.js":33,"./wall.js":35}],16:[function(require,module,exports){
var lastId = 0;

var api = {
    getId: function() {
        return 'a' + lastId++;
    }
};

module.exports = api;

},{}],17:[function(require,module,exports){
var weapon = require('./weapon.js');
//var world = require('./world.js');
var Bullet = require('./bullet.js');
var makeInventory = require('./makeInventory.js');

module.exports = function(options) {
    var gun = weapon();
    var bullet;
    if (options.pos) gun.move(options.pos);
    gun.use = function() {
        var bullet = gun.getInventory()[0];
        if (!bullet) {
            bullet = Bullet({velocity: 10, power: 10, range: 500});
            gun.takeItems(bullet);
            world.loadItems(bullet);
        }
        gun.dropItem(bullet);
        bullet.fire(gun.owner.pos);
    };

    gun.type = 'gun';

    for (var i = 0; i < options.startAmmo; i++) {
    }

    return gun;
};




},{"./bullet.js":6,"./makeInventory.js":21,"./weapon.js":36}],18:[function(require,module,exports){
module.exports = [
{"entity": "tile",
    "pos": {
        "x":9930,
        "y":10156,
        "rot":0.78
    },
    "width":"5000",
    "height":"5000"},
{"entity":"player",
    "pos": {"x":10023.028868996085,"y":9980.773164775213,"rot":0},"radius":50},
{"entity":"gun",
    "pos": {"x":10023.028868996085,"y":9980.773164775213,"rot":0}},
{"entity":"wall","pos":{"x":10448,"y":10773,"rot":0.78},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":9599,"y":9799,"rot":0.78},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":8133,"y":8445,"rot":0.78},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":10681,"y":9777,"rot":2.34},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":10924,"y":8514,"rot":1.58},"width":"100","height":"800"},{"entity":"wall","pos":{"x":10003,"y":8608,"rot":3.14},"width":"100","height":"1600"},{"entity":"wall","pos":{"x":11642,"y":8413,"rot":2.34},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":11695,"y":11877,"rot":0.78},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":8183,"y":11921,"rot":2.34},"width":"100","height":"5000"},{"entity":"wall","pos":{"x":10267,"y":8790,"rot":3.14},"width":"100","height":"1200"},{"entity":"wall","pos":{"x":10351,"y":7861,"rot":1.58},"width":"100","height":"800"},{"entity":"wall","pos":{"x":11024,"y":9055,"rot":0.3},"width":"400","height":"250"},{"entity":"wall","pos":{"x":11898,"y":9490,"rot":0.6},"width":"900","height":"100"},{"entity":"wall","pos":{"x":11619,"y":9895,"rot":0.6},"width":"900","height":"100"},{"entity":"wall","pos":{"x":9500,"y":11786,"rot":0},"width":"800","height":"800"},
{"entity":"zombieSpawner","pos":{"x":7769,"y":9411,"rot":0},"radius":10, "start": true, "interval": 20000, "spawnCount": 15},
{"entity":"zombieSpawner","pos":{"x":12379,"y":9449,"rot":0},"radius":10, "start": false, "interval": 45000, "spawnCount": 35},
{"entity":"zombieSpawner","pos":{"x":8760,"y":11983,"rot":0},"radius":10, "start": true, "interval": 20000, "spawnCount": 5}

];



},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){

module.exports = function(obj) {
    obj.getInitialConditions = function() {
        var initialConditions = {
            entity: obj.type,
            pos: {
                x: obj.pos.x,
                y: obj.pos.y,
                rot: obj.pos.rot
            },
        };
        if (obj.geometry && obj.geometry === 'circle') {
            initialConditions.radius = obj.radius;
        }
        if (obj.geometry && obj.geometry === 'square') {
            initialConditions.width = obj.width;
            initialConditions.height = obj.height;
        }
        if (obj.type === 'door') {
            initialConditions.openPos = obj.openPos;
            initialConditions.closePos = obj.closePos;
            initialConditions.opened = obj.opened;
        }
        var startOptions;
        if (obj.startOptions) {
            startOptions = obj.startOptions();
            for (var option in startOptions) {
                initialConditions[option] = startOptions[option];
            }
        }
        return initialConditions;
    };
};

},{}],21:[function(require,module,exports){

module.exports = function(obj) {

    var inventory = [];
    obj.takeItems = function(items) {
        if (!items.length) items = [items];
        items.forEach(function(item) {
            var currentObj = obj.getInventoryByType(item.type)[0];
            if (currentObj && currentObj.consolidateInventory) {
                currentObj.takeItems(item.getInventory());
                item.unload();
            } else {
                inventory.push(item);
                item.owner = obj;
                item.load();
            }
        });
    };
    obj.dropItem = function(item) {
        item.owner = false;
        inventory = inventory.filter(function(maybeItem) { if (maybeItem.id !== item.id) return true; });
    };
    obj.getInventory = function() {
        return inventory.slice();
    };
    obj.getInventoryByType = function(type) {
        return inventory.filter(function(item) { if (item.type === type) return true; });
    };
    obj.getInventoryByBase = function(base) {
        return inventory.filter(function(item) { if (item.base === base) return true; });
    };
}


},{}],22:[function(require,module,exports){
module.exports = function(obj) {
    obj.solid = true;
};

},{}],23:[function(require,module,exports){


module.exports = function(obj) {
    var startOptions = {};
    obj.startOptions = function(options) {
        if (!options) return startOptions;
        for (var option in options) {
            startOptions[option] = options[option];
        }
    };
};

},{}],24:[function(require,module,exports){
var textureData = require('./textureData.js');

module.exports = function makeVisible (obj) {
    obj.load(function() { 
        obj.textureData = textureData[obj.base][obj.type]; 
        obj.visible = true;
        obj.addEffect(function() {
            if (obj.inContainer()) {
                obj.visible = false;
            } else {
                obj.visible = true;
            }
            return true;
        });
    });
};

},{"./textureData.js":34}],25:[function(require,module,exports){
function MatrixStack() {
      this.stack = [];

      //since the stack is empty this will put an initial matrix in it
          this.restore();
}

// Pops the top of the stack restoring the previously saved matrix
MatrixStack.prototype.restore = function() {
    this.stack.pop();
    // Never let the stack be totally empty
    if (this.stack.length < 1) {
        this.stack[0] = m4.identity();
    }
};

// Pushes a copy of the current matrix on the stack
MatrixStack.prototype.save = function() {
    this.stack.push(this.getCurrentMatrix());
};

// Gets a copy of the current matrix (top of the stack)
MatrixStack.prototype.getCurrentMatrix = function() {
    return this.stack[this.stack.length - 1].slice();
};

// Lets us set the current matrix
MatrixStack.prototype.setCurrentMatrix = function(m) {
    return this.stack[this.stack.length - 1] = m;
};

// Translates the current matrix
MatrixStack.prototype.translate = function(x, y, z) {
    if (z === undefined) {
        z = 0;
    }
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// Rotates the current matrix around Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// Scales the current matrix
MatrixStack.prototype.scale = function(x, y, z) {
    if (z === undefined) {
        z = 1;
    }
    var m = this.getCurrentMatrix();
    this.setCurrentMatrix(m4.scale(m, x, y, z));
};


module.exports = MatrixStack;

},{}],26:[function(require,module,exports){

module.exports = function(url, data, callback) {
    var http = new XMLHttpRequest();
    var params = '';
    for (var param in data) {
        params += ((params.length) ? '&' : '') + param + '=' + data[param];
    }
    http.open('POST', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {//Call a function when the state changes.
        var data;
        if(http.readyState === 4 && http.status === 200) {
            data = JSON.parse(http.responseText);
            callback(data);
        }
    };
    http.send(params);

};


},{}],27:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var makeVisible = require('./makeVisible.js');
var makeGeometry = require('./makeGeometry.js');

module.exports = function() {
    var projectile = baseEntity();
    makeVisible(projectile);
    makeGeometry(projectile, 'circle');
    projectile.base = 'projectile';

    return projectile;
};


},{"./baseEntity.js":5,"./makeGeometry.js":19,"./makeVisible.js":24}],28:[function(require,module,exports){
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

},{"./webgl.js":37,"./world.js":38,"events":39}],29:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var zombie = require('./Zombie.js');
var makeStartOptions = require('./makeStartOptions.js');
var makeGeometry = require('./makeGeometry.js');
//var world = require('./world.js');

module.exports = function(options) {
    var spawner = baseEntity();
    makeStartOptions(spawner);
    makeGeometry(spawner, 'circle');
    var timer = Date.now();
    var spawning = options.start;
    var spawnCount = options.spawnCount;
    var lastSpawn = Date.now();
    spawner.startOptions({
        start: options.start,
        spawnCount: options.spawnCount,
        interval: options.interval
    });
    
    spawner.base = 'spawner';
    spawner.type = 'zombieSpawner';
    spawner.move(options.pos);
    spawner.step(function() {
        var now = Date.now();
        if (spawning) {
            if (spawnCount === 0) {
                spawnCount = options.spawnCount;
                spawning = false;
                timer = now;
            }
            if (now - lastSpawn > 500) {
                lastSpawn = now;
                world.loadItems(zombie({pos: spawner.pos}));
                spawnCount--;
            }

        } else {
            if (now - timer > options.interval) {
                spawning = true;
            }
        }
    });

    return spawner;
};


},{"./Zombie.js":2,"./baseEntity.js":5,"./makeGeometry.js":19,"./makeStartOptions.js":23}],30:[function(require,module,exports){
module.exports = {"frames":{"bullet":{"frame":{"x":453,"y":922,"w":201,"h":46},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":201,"h":46},"sourceSize":{"w":201,"h":46}},"machinegun":{"frame":{"x":0,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"pistol":{"frame":{"x":151,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"player":{"frame":{"x":0,"y":0,"w":1500,"h":280},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":280},"sourceSize":{"w":1500,"h":280}},"shotgun":{"frame":{"x":302,"y":922,"w":150,"h":150},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":150,"h":150},"sourceSize":{"w":150,"h":150}},"wall":{"frame":{"x":453,"y":969,"w":100,"h":100},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":100,"h":100},"sourceSize":{"w":100,"h":100}},"zombie1":{"frame":{"x":0,"y":1760,"w":1500,"h":560},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":560},"sourceSize":{"w":1500,"h":560}},"zombie2":{"frame":{"x":0,"y":281,"w":1500,"h":640},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":640},"sourceSize":{"w":1500,"h":640}},"zombie3":{"frame":{"x":0,"y":1634,"w":1500,"h":686},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":1500,"h":686},"sourceSize":{"w":1500,"h":686}}},"meta":{"app":"https://www.leshylabs.com/apps/sstool/","version":"Leshy SpriteSheet Tool v0.8.4","image":"spritesheet.png","size":{"w":1500,"h":2320},"scale":1}};

},{}],31:[function(require,module,exports){
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

},{"./baseEntity.js":5,"./makeGeometry.js":19,"./makeVisible.js":24}],32:[function(require,module,exports){
module.exports = [

    {entity: 'test', pos: {x: -400, y: -405, rot: 0}},
    {entity: 'test', pos: {x: -400, y: -405, rot: 0}}
    //{entity: 'wall', pos: {x: -450, y: -450, rot: 0}, dim: {w: 300, h: 300}},
    //{entity: 'square', pos: {x: -1250, y: -1250, rot: 45}, dim: {w: 2500, h: 2500}}

    /*{entity: 'Tile', pos: {x: 2500, y: 2500}, width: 5000, height: 5000, path: './img/background.jpg'},
    {entity: 'Block', path: './img/wall.png', pos: {x: 0, y: 3900, rot: 0}, width: 100, height: 2600},
    {entity: 'Block', path: './img/wall.png', pos: {x: 0, y: 1100, rot: 0}, width: 100, height: 2200},
    {entity: 'Block', path: './img/wall.png', pos: {x: 2500, y: 0, rot: 0}, width: 5000, height: 100},
    {entity: 'Block', path: './img/wall.png', pos: {x: 2500, y: 5000, rot: 0}, width: 5000, height: 100},
    {entity: 'Block', path: './img/wall.png', pos: {x: 5000, y: 2500, rot: 0}, width: 100, height: 5000},
    {entity: 'Block', path: './img/car1.png', pos: {x: 300, y: 300, rot: 2}, width: 200, height: 300},
    {entity: 'Zombie', img: 2, pos: {x: 1900, y: 1700, rot: 0}}
*/
];



},{}],33:[function(require,module,exports){
var baseEntity = require('./baseEntity.js');
var makeGeometry = require('./makeGeometry.js');
var makeSolid = require('./makeSolid.js');

module.exports = function(options) {
    var obj = baseEntity();
    obj.radius = 10;
    makeGeometry(obj, 'circle');
    makeSolid(obj);
    obj.base = 'obj';
    obj.type = 'test';
    obj.move(options.pos);
    obj.collide = function() {};

    return obj;
};


},{"./baseEntity.js":5,"./makeGeometry.js":19,"./makeSolid.js":22}],34:[function(require,module,exports){
var sprites = require('./sprites.js');

module.exports = {
    character: {
        zombie: { 
            frame: sprites.frames.zombie2.frame,
            poses: {
                x: 6,
                y: 4,
                slides: [6, 5, 2, 3]
            }
        },
        zombie2: { 
            frame: sprites.frames.zombie2.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        },
        zombie3: { 
            frame: sprites.frames.zombie3.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        },
        player: { 
            frame: sprites.frames.player.frame,
            poses: {
                x: 6,
                y: 2,
                slides: [6, 5]
            }
        }
    },
    projectile: {
        bullet: {
            frame: sprites.frames.bullet.frame
        }
    },
    square: {
        tile: {
            frame: sprites.frames.wall.frame
        },
        wall: {
            frame: sprites.frames.wall.frame
        },
        door: {
            frame: sprites.frames.wall.frame
        }
    },
    weapon: {
        gun: {
            frame: sprites.frames.pistol.frame
        }
    }
};

},{"./sprites.js":30}],35:[function(require,module,exports){
var square = require('./square.js');
var makeSolid = require('./makeSolid.js');
var makeVisible = require('./makeVisible.js');

module.exports = function(options) {
    var  wall = square(options);
    makeVisible(wall);
    wall.onTop = true;
    makeSolid(wall);
    wall.type = 'wall';

    return wall;
};

},{"./makeSolid.js":22,"./makeVisible.js":24,"./square.js":31}],36:[function(require,module,exports){
var makeVisible = require('./makeVisible.js');
var makeInventory = require('./makeInventory.js');
var baseEntity = require('./baseEntity.js');
var makeSolid = require('./makeSolid.js');
var makeGeometry = require('./makeGeometry.js');


module.exports = function() {
    var weapon = baseEntity();
    makeGeometry(weapon, 'circle');
    makeSolid(weapon);
    makeVisible(weapon);
    makeInventory(weapon);
    weapon.base = 'weapon';
    weapon.radius = '10';
    weapon.coolDown = 5;
    weapon.consolidateInventory = true;
    weapon.collide = function(collider) {
        switch (collider.type) {
            case 'player':
                break;
        }

    };

    return weapon;
};

},{"./baseEntity.js":5,"./makeGeometry.js":19,"./makeInventory.js":21,"./makeSolid.js":22,"./makeVisible.js":24}],37:[function(require,module,exports){
"use strict";
var matrixStack = require('./matrixStack.js');
var get = require('./get.js');
matrixStack = new matrixStack();

var gl, drawSquares, drawCircles, setUpCamera, texture, circleVertShader, squareVertShader, circleFragShader, squareFragShader, isLoaded;
var canvasSpace = {};
var assets = 0;
canvasSpace.width = 3000;
canvasSpace.height = 1500;

var loadedAsset = function() {
    assets++;
    if (assets === 5) loaded();
};

get('../glsl/circle.vert', function(data) {
    circleVertShader = data;
    loadedAsset();
});

get('../glsl/square.vert', function(data) {
    squareVertShader = data;
    loadedAsset();
});

get('../glsl/circle.frag', function(data) {
    circleFragShader = data;
    loadedAsset();
});

get('../glsl/square.frag', function(data) {
    squareFragShader = data;
    loadedAsset();
});

window.addEventListener('load', function() {
    loadedAsset();
});

var loaded = function() {
    isLoaded = true;
    var canvas = document.getElementById('canvas');
    canvas.setAttribute('width', canvasSpace.width);
    canvas.setAttribute('height', canvasSpace.height);
    gl = canvas.getContext('webgl');
    var ext = gl.getExtension("ANGLE_instanced_arrays"); // Vendor prefixes may apply!



    // Get A WebGL context
    /** @type {HTMLCanvasElement} */


    // setup GLSL program
    var circlesProgram = webglUtils.createProgramFromSources(gl, [circleVertShader, circleFragShader]);
    var squaresProgram = webglUtils.createProgramFromSources(gl, [squareVertShader, squareFragShader]);

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

    setUpCamera = function(pov) {
        var ortho = m4.orthographic(0, canvasSpace.width, canvasSpace.height, 0, -1, 1);
        gl.useProgram(squaresProgram);
        gl.uniformMatrix4fv(squareCameraMatrixLocation, false, ortho);
        gl.uniform2f(squareCanvasDimsLocation, canvasSpace.width / 2 - pov.x, canvasSpace.height / 2 - pov.y);
        gl.useProgram(circlesProgram);
        gl.uniformMatrix4fv(circleCameraMatrixLocation, false, ortho);
        gl.uniform2f(circleCanvasDimsLocation, canvasSpace.width / 2 - pov.x, canvasSpace.height / 2 - pov.y);
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
};


module.exports = {
    drawCircles: function() {
        drawCircles.apply(null, arguments);
    },
    drawSquares: function() {
        drawSquares.apply(null, arguments);
    },
    setUpCamera: function(pov) {
        setUpCamera(pov);
    },
    isLoaded: function() {
        return isLoaded;
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

},{"./get.js":14,"./matrixStack.js":25}],38:[function(require,module,exports){
var events = require('./events.js');
var level = {};
level.game = require('./level.js');
level.test = require('./test-level.js');
var Entities = require('./getEntities.js');
var circles = [];
var squares = [];
var points = [];
var xs = [];

var get = require('./get.js');

var world = [];
var newItems = [];
var universalDecorators = [];
var levelMetadata = {};

var api = {
    getObjByName: function(name) {
        return world.reduce(function(acc, item) { if (item.getObjName() === name) return item; }, null);
    },
    setLevelMetadata: function(newData) {
        for (var val in newData) {
            levelMetadata[val] = newData[val];
        }
        events.emit('updateLevelName');
    },
    getLevelMetadata: function() {
        return levelMetadata;
    },
    decorateAllItems: function(decorator) {
        world.forEach(function(item) { decorator(item); });
        universalDecorators.push(decorator);
    },
    unloadWorld: function() {
        world.forEach(function(item) {
            item.unload();
        });
        api.setLevelMetadata({
            id: null,
            name: null
        });
    },
    loadLevel: function(levelId, callback) {
        api.unloadWorld();
        get('./levels/' + levelId, function(data) {
            api.loadItems(JSON.parse(data.data));
            api.step();
            api.setLevelMetadata({
                name: data.name,
                id: data.id
            });
            if (callback) callback();
        });
        api.sortItems();
    },
    loadItems: function(items) {
        
        if (!Array.isArray(items)) {
            items = [items];
        }

        items = items.map(function(item) {
            var entity = item;
            if (!entity.type) entity = Entities[item.entity](item);
            entity.load();
            universalDecorators.forEach(function(decorator) {
                decorator(entity);
            });
            return entity;
        });
        newItems = newItems.concat(items);
        if (items.length > 1) return items;
        return items[0];
    },
    getItems: function() {
        return world.slice();
    },
    getItemById: function(id) {
        return world.filter(function(item) {
            if (item.id === id) return true;
        })[0];
    },
    getItemsByType: function(type) {
        return world.filter(function(item) {
            if (item.type === type) return true;
        });
    },
    deleteItem: function(id) {
        world = world.filter(function(item) { if (item.id !== id) return true; });
        events.emit('entityCount');
    },
    getXs: function() {
        return xs;
    },
    updateNewItems: function() {
        world = world.concat(newItems);
        api.sortItems();
        if (newItems.length) events.emit('entityCount');
        newItems = [];
    },
    step: function() {
        api.updateNewItems();
        xs = [];
        ys = [];
        newItems = [];
        circles = [];
        squares = [];
        points = [];
        world.forEach(function(item) { 
            if (item.geometry === 'circle' && item.visible) circles.push(item);
            if (item.geometry === 'square' && item.visible) squares.push(item);
            if (item.geometry === 'point' && item.visible) points.push(item);
            item.collisionData = {};
            item.step.call(item); 
            if (item.geometry && item.solid && !item.inContainer()) xs = xs.concat(item.AABB.xs);
        });
        api.sortItems();
        xs.sort(function(a, b) {
            return (a.val - b.val);
        });
    },
    sortItems: function() {
        world.sort(function(a, b) {
            return a.onTop;
        });
    },
    getGeometry: function(geometry) {
        if (geometry === 'circle') return circles;
        if (geometry === 'square') return squares;
        if (geometry === 'point') return points;
    },
    getAllItemsSortedByGeometry: function() {
        return [squares, circles, points];
    },
    getEntityTypes: function() {
        var entities = [];
        for (var entity in Entities) {
            entities.push(entity);
        };
        return entities;
    }
};

module.exports = api;

},{"./events.js":13,"./get.js":14,"./getEntities.js":15,"./level.js":18,"./test-level.js":32}],39:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIlBsYXllci5qcyIsIlpvbWJpZS5qcyIsImFuaW1hdGlvblNoaW0uanMiLCJhcmVhLmpzIiwiYmFzZUVudGl0eS5qcyIsImJ1bGxldC5qcyIsImNoYXJhY3Rlci5qcyIsImRvbS5qcyIsImRvb3IuanMiLCJlZGl0b3ItY29udHJvbGxlci5qcyIsImVkaXRvci1tYWluLmpzIiwiZWZmZWN0cy5qcyIsImV2ZW50cy5qcyIsImdldC5qcyIsImdldEVudGl0aWVzLmpzIiwiZ2V0SWQuanMiLCJndW4uanMiLCJsZXZlbC5qcyIsIm1ha2VHZW9tZXRyeS5qcyIsIm1ha2VJbml0aWFsQ29uZGl0aW9uc1NhdmFibGUuanMiLCJtYWtlSW52ZW50b3J5LmpzIiwibWFrZVNvbGlkLmpzIiwibWFrZVN0YXJ0T3B0aW9ucy5qcyIsIm1ha2VWaXNpYmxlLmpzIiwibWF0cml4U3RhY2suanMiLCJwb3N0LmpzIiwicHJvamVjdGlsZS5qcyIsInJlbmRlcmVyLmpzIiwic3Bhd25lci5qcyIsInNwcml0ZXMuanMiLCJzcXVhcmUuanMiLCJ0ZXN0LWxldmVsLmpzIiwidGVzdC1vYmouanMiLCJ0ZXh0dXJlRGF0YS5qcyIsIndhbGwuanMiLCJ3ZWFwb24uanMiLCJ3ZWJnbC5qcyIsIndvcmxkLmpzIiwiLi4vLi4vLi4vLi4vLi4vdXNyL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIENoYXJhY3RlciA9IHJlcXVpcmUoJy4vY2hhcmFjdGVyLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgdmFyIHBsYXllciA9IENoYXJhY3Rlcih7XG4gICAgICAgIHBvczogb3B0aW9ucy5wb3MsXG4gICAgICAgIHR5cGU6ICdwbGF5ZXInLFxuICAgICAgICBtb2RlOiAnc3RhbmRpbmcnLFxuICAgICAgICBtb2Rlczoge1xuICAgICAgICAgICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBldmVudHMuZW1pdCgnZGllJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhbmRpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5wb3NlLnkgPSAwO1xuICAgICAgICAgICAgICAgIHBsYXllci52ZWxvY2l0eSA9IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmluZzogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YWxraW5nOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob290aW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9zZS55ID0gMTtcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLmN1cnJlbnRXZWFwb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHZhciBjb29sRG93biA9IHBsYXllci5jdXJyZW50V2VhcG9uc1twbGF5ZXIud2VpbGRpbmddLmNvb2xEb3duO1xuICAgICAgICAgICAgICAgIHZhciB0aWNrID0gY29vbERvd24gLSAxO1xuICAgICAgICAgICAgICAgIHBsYXllci5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwbGF5ZXIuY3VycmVudE1vZGUgIT09ICdzaG9vdGluZycpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGljaysrO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGljayA+IGNvb2xEb3duKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLmN1cnJlbnRXZWFwb25zW3BsYXllci53ZWlsZGluZ10udXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjb2xsaWRlOiBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci5iYXNlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnd2VhcG9uJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb2xsaWRlci5pbkNvbnRhaW5lcigpKSBwbGF5ZXIudGFrZUl0ZW1zKGNvbGxpZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnem9tYmllJzpcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmVtaXQoJ2dhbWVPdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdnYW1lb3ZlcnJycnJyJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vcGxheWVyLmhlYWx0aCAtPSAwLjQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FyZWEnOiBcblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH0pO1xuICAgIHBsYXllci5uZXh0V2VhcG9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci53ZWlsZGluZysrO1xuICAgICAgICBpZiAod2VpbGRpbmcgPT09IHBsYXllci5jdXJyZW50V2VhcG9ucy5sZW5ndGgpIHdlaWxkaW5nID0gMDtcbiAgICB9O1xuICAgIHBsYXllci53ZWlsZGluZyA9IDA7XG4gICAgcGxheWVyLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmN1cnJlbnRXZWFwb25zID0gcGxheWVyLmdldEludmVudG9yeUJ5QmFzZSgnd2VhcG9uJyk7XG4gICAgICAgIHBsYXllci5jdXJyZW50V2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbiwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh3ZWFwb24uc2VsZWN0V2VhcG9uKSBwbGF5ZXIud2VpbGRpbmcgPSBpbmRleDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG5cbiAgICByZXR1cm4gcGxheWVyO1xufTtcbiIsInZhciBDaGFyYWN0ZXIgPSByZXF1aXJlKCcuL2NoYXJhY3Rlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBjdXJyZW50QXR0cmFjdG9yID0gZmFsc2U7XG4gICAgdmFyIHNwZWVkID0gMSArIE1hdGgucmFuZG9tKCkgKiAzO1xuXG4gICAgdmFyIHpvbWJpZSA9IENoYXJhY3Rlcih7XG4gICAgICAgIHR5cGU6ICd6b21iaWUnLFxuICAgICAgICBtb2RlOiAnd2FuZGVyaW5nJyxcbiAgICAgICAgcG9zOiBvcHRpb25zLnBvcyxcbiAgICAgICAgbW9kZXM6IHtcbiAgICAgICAgICAgIHJld2FuZGVyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnd2FuZGVyaW5nJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2FuZGVyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd3YW5kZXJpbmcnKTtcbiAgICAgICAgICAgICAgICAvL2lmIChNYXRoLnJhbmRvbSgpIDwgMC4wNSkgem9tYmllLmF1ZGlvID0gJ2dyb3dsJztcbiAgICAgICAgICAgICAgICB2YXIgdGltZUxlbmd0aCA9IDEgKyBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMyAqIDEwMDApO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21TcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAyO1xuICAgICAgICAgICAgICAgIHpvbWJpZS5wb3Mucm90ID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgICAgIHpvbWJpZS5wb3NlLnkgPSAxO1xuXG4gICAgICAgICAgICAgICAgem9tYmllLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh6b21iaWUuY3VycmVudE1vZGUgIT09ICd3YW5kZXJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VGltZSArIHRpbWVMZW5ndGggPCBub3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdyZXdhbmRlcmluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB6b21iaWUucHVzaCh7eDogTWF0aC5jb3Moem9tYmllLnBvcy5yb3QpICogcmFuZG9tU3BlZWQsIHk6IE1hdGguc2luKHpvbWJpZS5wb3Mucm90KSAqIHJhbmRvbVNwZWVkfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlYXJjaGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hhc2luZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgem9tYmllLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gem9tYmllLmxvb2tBdE9iaihjdXJyZW50QXR0cmFjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHpvbWJpZS5jdXJyZW50TW9kZSAhPT0gJ2NoYXNpbmcnIHx8ICFjdXJyZW50QXR0cmFjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgem9tYmllLnB1c2goe3g6IE1hdGguY29zKHRoZXRhKSAqIHNwZWVkIC8gMiwgeTogTWF0aC5zaW4odGhldGEpICogc3BlZWQgLyAyfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJpdGluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhZ2dlcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB6b21iaWUudW5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxpZGU6IGZ1bmN0aW9uKGNvbGxpZGVyKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbGxpZGVyLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdidWxsZXQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ21lZWxlZSc6XG4gICAgICAgICAgICAgICAgICAgIHpvbWJpZS5oZWFsdGggLT0gY29sbGlkZXIucG93ZXIgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB6b21iaWUuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgY3VycmVudEF0dHJhY3RvciA9IHdvcmxkLmdldEl0ZW1zQnlUeXBlKCdwbGF5ZXInKVswXTtcbiAgICAgICAgaWYgKGN1cnJlbnRBdHRyYWN0b3IpIHtcbiAgICAgICAgICAgIHpvbWJpZS5hZGRNb2RlKCdjaGFzaW5nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB6b21iaWUuYWRkTW9kZSgnd2FuZGVyaW5nJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB6b21iaWU7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgdmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xuICAgIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIFxuICAgICAgICAgICAgfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgIH1cblxuICAgIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSlcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICAgICAgdmFyIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSlcbiAgICAgICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgICAgICAgIH07XG59KCkpO1xuIiwidmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xudmFyIHNxdWFyZSA9IHJlcXVpcmUoJy4vc3F1YXJlLmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIG9iakV2ZW50cyA9IFtdO1xuICAgIHZhciBhcmVhID0gc3F1YXJlKG9wdGlvbnMpO1xuICAgIGFyZWEub25Ub3AgPSB0cnVlO1xuICAgIGFyZWEudHlwZSA9ICdhcmVhJztcbiAgICBhcmVhLnBsYXllck1lc3NhZ2UgPSAnJztcbiAgICBhcmVhLmFkZE9iakV2ZW50ID0gZnVuY3Rpb24odHJpZ2dlciwgdmVyYiwgbm91bikge1xuICAgICAgICB2YXIgaWQgPSBnZXRJZCgpO1xuICAgICAgICBvYmpFdmVudHMucHVzaCh7aWQ6IGlkLCB0cmlnZ2VyOiB0cmlnZ2VyLCB2ZXJiOiB2ZXJiLCBub3VuOiBub3VufSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuICAgIGFyZWEuZGVsZXRlT2JqRXZlbnQgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICBvYmpFdmVudHMgPSBvYmpFdmVudHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIChpdGVtLmlkICE9PSBpZCk7IH0pO1xuICAgIH07XG4gICAgYXJlYS5nZXRPYmpFdmVudCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGlmIChpZCkgcmV0dXJuIG9iakV2ZW50cy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS5pZCA9IGlkKSByZXR1cm4gdHJ1ZTsgfSlbMF07XG4gICAgICAgIHJldHVybiBvYmpFdmVudHM7XG4gICAgfTtcbiAgICBhcmVhLmNvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICBvYmpFdmVudHMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS50cmlnZ2VyID09PSBjb2xsaWRlci50eXBlIHx8IGl0ZW0udHJpZ2dlciA9PT0gY29sbGlkZXIuYmFzZSkge1xuICAgICAgICAgICAgICAgIHdvcmxkLmdldE9iakJ5TmFtZShpdGVtLm5vdW4pLnZlcmJzW2l0ZW0udmVyYl0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcmVhO1xufTtcbiIsInZhciBnZXRJZCA9IHJlcXVpcmUoJy4vZ2V0SWQuanMnKS5nZXRJZDtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwdXNoRXZlbnRzID0gW107XG4gICAgdmFyIG1vdmVFdmVudHMgPSBbXTtcbiAgICB2YXIgbG9hZEV2ZW50cyA9IFtdO1xuICAgIHZhciB1bmxvYWRFdmVudHMgPSBbXTtcbiAgICB2YXIgc3RlcEV2ZW50cyA9IFtdO1xuICAgIHZhciBsb2FkZWQgPSBmYWxzZTtcbiAgICB2YXIgb2JqTmFtZSA9IGZhbHNlO1xuICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuICAgIHZhciBuZXdFZmZlY3RzID0gW107XG4gICAgdmFyIGVmZmVjdHMgPSBbXTtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgICBpbkNvbnRhaW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKCEhb2JqLm93bmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0T2JqTmFtZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgb2JqTmFtZSA9IG5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGdldE9iak5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iak5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihlKSB7IGUoKTsgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZEV2ZW50cyA9IGFyZ3MuY29uY2F0KGxvYWRFdmVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxvYWRlZCkge1xuICAgICAgICAgICAgICAgIGxvYWRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlKSB7IGUoKTsgfSk7XG4gICAgICAgICAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdW5sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkgcmV0dXJuIHVubG9hZEV2ZW50cyA9IGFyZ3MuY29uY2F0KHVubG9hZEV2ZW50cyk7XG4gICAgICAgICAgICB1bmxvYWRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlKSB7IGUoKTsgfSk7XG4gICAgICAgICAgICB3b3JsZC5kZWxldGVJdGVtKG9iai5pZCk7XG4gICAgICAgICAgICBpZiAob2JqLm93bmVyKSBvYmoub3duZXIuZHJvcEl0ZW0ob2JqKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHJldHVybiBzdGVwRXZlbnRzID0gYXJncy5jb25jYXQoc3RlcEV2ZW50cyk7XG4gICAgICAgICAgICBzdGVwRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZSkgeyBlKCk7IH0pO1xuICAgICAgICAgICAgZWZmZWN0cyA9IGVmZmVjdHMuY29uY2F0KG5ld0VmZmVjdHMpO1xuICAgICAgICAgICAgbmV3RWZmZWN0cyA9IFtdO1xuICAgICAgICAgICAgZWZmZWN0cyA9IGVmZmVjdHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uY2FsbChvYmopOyB9KTtcbiAgICAgICAgICAgIGlmIChtb3ZlZCkgb2JqLnByb2Nlc3NNb3ZlbWVudEV2ZW50cygpO1xuICAgICAgICAgICAgaWYgKG9iai5wb3Mucm90ID4gTWF0aC5QSSAqIDIpIG9iai5wb3Mucm90IC09IE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgaWYgKG9iai5wb3Mucm90IDwgMCkgb2JqLnBvcy5yb3QgKz0gTWF0aC5QSSAqIDI7XG5cbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2Vzc01vdmVtZW50RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIG9iai52ZWxvY2l0eSA9IE1hdGguc3FydChvYmoucG9zLnZlYy54ICogb2JqLnBvcy52ZWMueCArIG9iai5wb3MudmVjLnkgKiBvYmoucG9zLnZlYy55KTtcbiAgICAgICAgICAgIGlmIChvYmoudmVsb2NpdHkgPiAzMCkge1xuICAgICAgICAgICAgICAgIC8vZGVidWdnZXI7XG4gICAgICAgICAgICAgICAgb2JqLnBvcy52ZWMueCA9IG9iai5wb3MudmVjLnggLyAob2JqLnZlbG9jaXR5IC8gMzApO1xuICAgICAgICAgICAgICAgIG9iai5wb3MudmVjLnkgPSBvYmoucG9zLnZlYy55IC8gKG9iai52ZWxvY2l0eSAvIDMwKTtcbiAgICAgICAgICAgICAgICBvYmoudmVsb2NpdHkgPSAzMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9iai5wb3MueCArPSBvYmoucG9zLnZlYy54O1xuICAgICAgICAgICAgb2JqLnBvcy55ICs9IG9iai5wb3MudmVjLnk7XG4gICAgICAgICAgICBpZiAob2JqLm93bmVyKSB7XG4gICAgICAgICAgICAgICAgb2JqLm1vdmUob2JqLm93bmVyLnBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmoucG9zLnZlYy54ID0gMDtcbiAgICAgICAgICAgIG9iai5wb3MudmVjLnkgPSAwO1xuICAgICAgICAgICAgbW92ZUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGZuKSB7IGZuKCk7IH0pO1xuICAgICAgICAgICAgbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgaWQ6IGdldElkKCksXG4gICAgICAgIHBvczoge1xuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICByb3Q6IDAsXG4gICAgICAgICAgICB2ZWM6IHtcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbW92ZTogZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICBpZiAocG9zLmV2KSB7XG4gICAgICAgICAgICAgICAgbW92ZUV2ZW50cy5wdXNoKHBvcy5ldik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocG9zLngpIG9iai5wb3MueCA9IHBvcy54O1xuICAgICAgICAgICAgaWYgKHBvcy55KSBvYmoucG9zLnkgPSBwb3MueTtcbiAgICAgICAgICAgIGlmIChwb3Mucm90KSBvYmoucG9zLnJvdCA9IHBvcy5yb3Q7XG4gICAgICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uKHZlYykge1xuICAgICAgICAgICAgaWYgKHZlYy5ldikge1xuICAgICAgICAgICAgICAgIG1vdmVFdmVudHMucHVzaCh2ZWMuZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZlYy54KSBvYmoucG9zLnZlYy54ICs9IHZlYy54O1xuICAgICAgICAgICAgaWYgKHZlYy55KSBvYmoucG9zLnZlYy55ICs9IHZlYy55O1xuICAgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFZmZlY3Q6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICBuZXdFZmZlY3RzLnB1c2goZm4pO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbiIsInZhciBwcm9qZWN0aWxlID0gcmVxdWlyZSgnLi9wcm9qZWN0aWxlLmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcblxudmFyIEJ1bGxldCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgIHZhciBidWxsZXQgPSBwcm9qZWN0aWxlKCk7XG5cbiAgICBidWxsZXQuZmlyZSA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSAwO1xuICAgICAgICB2YXIgdGhldGEgPSBwb3Mucm90O1xuICAgICAgICBidWxsZXQuaW5lcnRpYSA9IHRydWU7XG4gICAgICAgIGJ1bGxldC5wb3Mucm90ID0gcG9zLnJvdDtcbiAgICAgICAgYnVsbGV0Lm9uVG9wID0gdHJ1ZTtcbiAgICAgICAgYnVsbGV0LnZlbG9jaXR5ID0gMjU7XG4gICAgICAgIG1ha2VTb2xpZChidWxsZXQpO1xuICAgICAgICBidWxsZXQuc3RlcChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChidWxsZXQuZGllIHx8IGRpc3RhbmNlID4gYnVsbGV0LnJhbmdlKSBidWxsZXQudW5sb2FkKCk7XG4gICAgICAgICAgICBkaXN0YW5jZSsrO1xuICAgICAgICAgICAgYnVsbGV0LnB1c2goe3g6IE1hdGguY29zKHRoZXRhKSAqIGJ1bGxldC52ZWxvY2l0eSwgeTogTWF0aC5zaW4odGhldGEpICogYnVsbGV0LnZlbG9jaXR5fSk7XG4gICAgICAgIH0pO1xuICAgICAgICBidWxsZXQucmFkaXVzID0gMTtcbiAgICAgICAgYnVsbGV0LmNvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcil7XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbGxpZGVyLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICd6b21iaWUnOlxuICAgICAgICAgICAgICAgICAgICBidWxsZXQudW5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChjb2xsaWRlci5iYXNlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3F1YXJlJzpcbiAgICAgICAgICAgICAgICAgICAgYnVsbGV0LnVubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBidWxsZXQubW92ZSh7eDogcG9zLnggKyBNYXRoLmNvcyh0aGV0YSkgKiA3NSwgeTogcG9zLnkgKyBNYXRoLnNpbih0aGV0YSkgKiA3NX0pO1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICBidWxsZXRba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBidWxsZXQudHlwZSA9ICdidWxsZXQnO1xuICAgIHJldHVybiBidWxsZXQ7XG59O1xuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1bGxldDtcbiIsInZhciBiYXNlRW50aXR5ID0gcmVxdWlyZSgnLi9iYXNlRW50aXR5LmpzJyk7XG52YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG52YXIgbWFrZUludmVudG9yeSA9IHJlcXVpcmUoJy4vbWFrZUludmVudG9yeS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG52YXIgbWFrZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9tYWtlR2VvbWV0cnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGNoYXJhY3RlciA9IGJhc2VFbnRpdHkoKTtcbiAgICB2YXIgYW5pVGljayA9IDA7XG4gICAgbWFrZUludmVudG9yeShjaGFyYWN0ZXIpO1xuICAgIG1ha2VHZW9tZXRyeShjaGFyYWN0ZXIsICdjaXJjbGUnKTtcbiAgICBtYWtlU29saWQoY2hhcmFjdGVyKTtcbiAgICBtYWtlVmlzaWJsZShjaGFyYWN0ZXIpO1xuICAgIGNoYXJhY3Rlci5yYWRpdXMgPSA1MDtcbiAgICBjaGFyYWN0ZXIuc29saWQgPSB0cnVlO1xuICAgIGNoYXJhY3Rlci5vblRvcCA9IHRydWU7XG4gICAgY2hhcmFjdGVyLmdlb21ldHJ5ID0gJ2NpcmNsZSc7XG4gICAgY2hhcmFjdGVyLmxvb2tBdFZlYyA9IGZ1bmN0aW9uKHZlYykge1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKHZlYy55LCB2ZWMueCk7XG4gICAgICAgIGNoYXJhY3Rlci5wb3Mucm90ID0gdGhldGEgKyBNYXRoLlBJO1xuICAgICAgICByZXR1cm4gdGhldGE7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIubG9va0F0T2JqID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIob2JqLnBvcy55IC0gY2hhcmFjdGVyLnBvcy55LCBvYmoucG9zLnggLSBjaGFyYWN0ZXIucG9zLngpO1xuICAgICAgICBjaGFyYWN0ZXIucG9zLnJvdCA9IHRoZXRhO1xuICAgICAgICByZXR1cm4gdGhldGE7XG4gICAgfTtcbiAgICBjaGFyYWN0ZXIuYmFzZSA9ICdjaGFyYWN0ZXInO1xuICAgIGNoYXJhY3Rlci5oZWFsdGggPSAxO1xuICAgIGNoYXJhY3Rlci5zdGVwKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoY2hhcmFjdGVyLmhlYWx0aCA8PSAwKSBjaGFyYWN0ZXIuYWRkTW9kZSgnZGllJyk7XG4gICAgICAgIGFuaVRpY2srKztcbiAgICAgICAgaWYgKCFjaGFyYWN0ZXIudmVsb2NpdHkpIHtcbiAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLnggPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGFuaVRpY2sgPiAxNiAtIGNoYXJhY3Rlci52ZWxvY2l0eSkge1xuICAgICAgICAgICAgICAgIGFuaVRpY2sgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChjaGFyYWN0ZXIucG9zZS54IDwgY2hhcmFjdGVyLnRleHR1cmVEYXRhLnBvc2VzLnNsaWRlc1tjaGFyYWN0ZXIucG9zZS55XSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyLnBvc2UueCsrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3Rlci5wb3NlLnggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5pVGljaysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2hhcmFjdGVyLm1vZGVzID0gb3B0aW9ucy5tb2RlcztcbiAgICBjaGFyYWN0ZXIuY29sbGlkZSA9IG9wdGlvbnMuY29sbGlkZTtcbiAgICBjaGFyYWN0ZXIudHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgICBjaGFyYWN0ZXIuYWRkTW9kZSA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgICAgICAgaWYgKGNoYXJhY3Rlci5jdXJyZW50TW9kZSA9PT0gbW9kZSkgcmV0dXJuO1xuICAgICAgICBjaGFyYWN0ZXIuY3VycmVudE1vZGUgPSBtb2RlO1xuICAgICAgICBjaGFyYWN0ZXIubW9kZXNbbW9kZV0oKTtcbiAgICB9O1xuICAgIGNoYXJhY3Rlci5wb3NlID0ge3g6IDAsIHk6IDB9O1xuICAgIGNoYXJhY3Rlci5sb2FkKGZ1bmN0aW9uKCkgeyBjaGFyYWN0ZXIuYWRkTW9kZShvcHRpb25zLm1vZGUpOyB9KTtcbiAgICBjaGFyYWN0ZXIubW92ZShvcHRpb25zLnBvcyk7XG4gICAgcmV0dXJuIGNoYXJhY3Rlcjtcbn07XG5cbiIsImRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9XG52YXIgbG9hZGVkID0gZmFsc2U7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBnZXRJZCA9IHJlcXVpcmUoJy4vZ2V0SWQuanMnKS5nZXRJZDtcbnZhciBlZmZlY3RzID0gcmVxdWlyZSgnLi9lZmZlY3RzLmpzJyk7XG52YXIgb2JqcyA9IHt9O1xudmFyIG1lbnVzID0ge307XG52YXIgaW5wdXRzID0ge307XG53aW5kb3cuZnVuY3Rpb25zID0ge307XG52YXIgbWVudUNsb3NlRXZlbnRzID0ge307XG52YXIgbG9hZEV2ZW50cyA9IFtdO1xudmFyIGNhbnZhc2VzID0ge307XG52YXIgb2xkV2VhcG9ucyA9IFtdO1xudmFyIGljb25FdmVudHMgPSBbXTtcbnZhciB3ZWFwb25JY29ucyA9IFtdO1xuXG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgXG4gICAgW10uc2xpY2UuY2FsbChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtZW51cycpKS5mb3JFYWNoKGZ1bmN0aW9uKG9iaiwgaW5kZXgsIGFycmF5KSB7IFxuICAgICAgICBtZW51c1tvYmouaWRdID0gb2JqOyBcbiAgICAgICAgZWZmZWN0cy5mYWRlT3V0KG9iaik7XG4gICAgfSk7XG4gICAgW10uc2xpY2UuY2FsbChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdkb21vYmonKSkuZm9yRWFjaChmdW5jdGlvbihvYmosIGluZGV4LCBhcnJheSkgeyBcbiAgICAgICAgb2Jqc1tvYmouaWRdID0gb2JqOyBcbiAgICB9KTtcbiAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpKS5mb3JFYWNoKGZ1bmN0aW9uKG9iaiwgaW5kZXgsIGFycmF5KSB7IFxuICAgICAgICBpbnB1dHNbb2JqLmlkXSA9IG9iajsgXG4gICAgfSk7XG4gICAgLy9vYmpzWydtb2RhbEFjayddLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7IGVmZmVjdHMuZmFkZU91dChvYmpzWydtb2RhbCddKTsgfSk7XG4gICAgb2Jqc1snd2luZG93J10gPSB3aW5kb3c7XG4gICAgbG9hZGVkID0gdHJ1ZTsgXG4gICAgbG9hZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGV2KSB7IGV2KCk7IH0pOyBcbn07XG5cbnZhciBlbnN1cmVPYmpJZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmouaWQpIHJldHVybiBvYmouaWQ7XG4gICAgb2JqLmlkID0gZ2V0SWQoKTtcbiAgICBvYmpzW29iai5pZF0gPSBvYmo7XG4gICAgcmV0dXJuIG9iai5pZDtcbn07XG5cbnZhciByZXNldENhbnZhcyA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICAgIHZhciBjYW52YXNXaWR0aCA9IGNhbnZhcy5nZXRBdHRyaWJ1dGUoJ3dpZHRoJyk7XG4gICAgdmFyIGNhbnZhc0hlaWdodCA9IGNhbnZhcy5nZXRBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgIHZhciBzY3JlZW5XaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHZhciBzY3JlZW5IZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgaWYgKGNhbnZhc1dpZHRoIC8gY2FudmFzSGVpZ2h0ID4gc2NyZWVuV2lkdGggLyBzY3JlZW5IZWlnaHQpIHtcbiAgICAgICAgY2FudmFzLnN0eWxlLndpZHRoID0gc2NyZWVuV2lkdGggKyAncHgnO1xuICAgICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gc2NyZWVuV2lkdGggKiAoY2FudmFzSGVpZ2h0IC8gY2FudmFzV2lkdGgpICsgJ3B4JztcbiAgICAgICAgY2FudmFzLnN0eWxlLnRvcCA9IChzY3JlZW5IZWlnaHQgLSAoc2NyZWVuV2lkdGggKiAoY2FudmFzSGVpZ2h0IC8gY2FudmFzV2lkdGgpKSkgLyAyICsgJ3B4JztcbiAgICAgICAgY2FudmFzLnN0eWxlLmxlZnQgPSAnMHB4JzsgXG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IHNjcmVlbkhlaWdodCArICdweCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHNjcmVlbkhlaWdodCAqIChjYW52YXNXaWR0aCAvIGNhbnZhc0hlaWdodCkgKyAncHgnO1xuICAgICAgICBjYW52YXMuc3R5bGUubGVmdCA9IChzY3JlZW5XaWR0aCAtIChzY3JlZW5IZWlnaHQgKiAoY2FudmFzV2lkdGggLyBjYW52YXNIZWlnaHQpKSkgLyAyICsgJ3B4JztcbiAgICAgICAgY2FudmFzLnN0eWxlLnRvcCA9ICcwcHgnOyBcbiAgICB9XG59O1xuXG5cblxudmFyIGFwaSA9IHtcbiAgICBzZXRDYW52YXM6IGZ1bmN0aW9uKGlkLCBkaW0pIHtcbiAgICAgICAgaWYgKGRpbSkge1xuICAgICAgICAgICAgb2Jqc1tpZF0uc2V0QXR0cmlidXRlKCd3aWR0aCcsIGRpbS53aWR0aCk7XG4gICAgICAgICAgICBvYmpzW2lkXS5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIGRpbS5oZWlnaHQpO1xuICAgICAgICAgICAgaWYgKCFjYW52YXNlc1tpZF0pIHtcbiAgICAgICAgICAgICAgICBjYW52YXNlc1tpZF0gPSBvYmpzW2lkXTtcbiAgICAgICAgICAgICAgICByZXNldENhbnZhcyhvYmpzW2lkXSk7XG4gICAgICAgICAgICAgICAgYXBpLmF0dGFjaEV2ZW50KCd3aW5kb3cnLCAncmVzaXplJywgcmVzZXRDYW52YXMuYmluZChudWxsLCBvYmpzW2lkXSkpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2Jqc1tpZF0uZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgICB9LFxuICAgIGNsZWFySW5wdXRzOiBmdW5jdGlvbihhbmNlc3Rvcikge1xuICAgICAgICBhbmNlc3RvciA9IGFwaS5nZXRPYmpCeUlkKGFuY2VzdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaW5wdXQgaW4gaW5wdXRzKSB7XG4gICAgICAgICAgICBpZiAoYW5jZXN0b3IuY29udGFpbnMoaW5wdXRzW2lucHV0XSkpIGlucHV0c1tpbnB1dF0udmFsdWUgPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgb25IaWRlTWVudTogZnVuY3Rpb24oaWQsIGZ1bmMpIHtcbiAgICAgICAgaWYgKCFtZW51Q2xvc2VFdmVudHNbaWRdKSBtZW51Q2xvc2VFdmVudHNbaWRdID0gW107XG4gICAgICAgIG1lbnVDbG9zZUV2ZW50c1tpZF0ucHVzaChmdW5jKTtcbiAgICB9LFxuICAgIGhpZGVNZW51OiBmdW5jdGlvbihpZCkge1xuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIGVmZmVjdHMuZmFkZU91dChtZW51c1tpZF0pO1xuICAgICAgICAgICAgaWYgKG1lbnVDbG9zZUV2ZW50c1tpZF0pIHtcbiAgICAgICAgICAgICAgICBtZW51Q2xvc2VFdmVudHNbaWRdLmZvckVhY2goZnVuY3Rpb24oZikgeyBmKCk7IH0pO1xuICAgICAgICAgICAgICAgIG1lbnVDbG9zZUV2ZW50c1tpZF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBtZW51IGluIG1lbnVzKSB7XG4gICAgICAgICAgICBpZiAobWVudXNbbWVudV0uaWQgIT09ICd3b3JsZEluc3BlY3RvcicpIHtcbiAgICAgICAgICAgICAgICBlZmZlY3RzLmZhZGVPdXQobWVudXNbbWVudV0pO1xuICAgICAgICAgICAgICAgIGlmIChtZW51Q2xvc2VFdmVudHNbbWVudV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudUNsb3NlRXZlbnRzW21lbnVdLmZvckVhY2goZnVuY3Rpb24oZikgeyBmKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBtZW51Q2xvc2VFdmVudHNbbWVudV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNob3dNZW51OiBmdW5jdGlvbihpZCwgcG9zKSB7XG4gICAgICAgIGVmZmVjdHMuZmFkZUluKG1lbnVzW2lkXSk7XG4gICAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgICAgIG1lbnVzW2lkXS5zdHlsZS5sZWZ0ID0gcGFyc2VJbnQocG9zLnggLSAyMCkgKyAncHgnO1xuICAgICAgICAgICAgbWVudXNbaWRdLnN0eWxlLnRvcCA9IHBhcnNlSW50KHBvcy55IC0gMjApICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0SXRlbXNCeUNsYXNzOiBmdW5jdGlvbihjKSB7XG4gICAgICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYykpLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgfSk7O1xuICAgIH0sXG4gICAgYWRkTGlzdEl0ZW06IGZ1bmN0aW9uKHVsLCBsaSkge1xuICAgICAgICBvYmpzW3VsXS5hcHBlbmRDaGlsZChvYmpzW2xpXSk7XG4gICAgfSxcbiAgICBhZGRNZW51TGlzdEl0ZW06IGZ1bmN0aW9uKGlkLCB0ZXh0LCBjbGljaywgbW91c2VvdmVyKSB7XG4gICAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBlbnN1cmVPYmpJZChsaSk7XG4gICAgICAgIHNwYW4uaW5uZXJUZXh0ID0gdGV4dDtcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIGlmIChjbGljaykgc3Bhbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrKTtcbiAgICAgICAgaWYgKG1vdXNlb3Zlcikgc3Bhbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBtb3VzZW92ZXIpO1xuICAgICAgICBvYmpzW2lkXS5hcHBlbmRDaGlsZChsaSk7XG4gICAgICAgIHJldHVybiBsaS5pZDtcbiAgICB9LFxuICAgIGNsZWFyTGlzdEl0ZW1zOiBmdW5jdGlvbihpZCkge1xuICAgICAgICBbXS5zbGljZS5jYWxsKG9ianNbaWRdLmNoaWxkcmVuKS5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgIGlmICghY2hpbGQuY2xhc3NOYW1lLnNwbGl0KCcgJykucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGIgPT09ICdsaXN0SXRlbScpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgfSwgZmFsc2UpKSBvYmpzW2lkXS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0SW5wdXRzVmFsdWVzOiBmdW5jdGlvbihhbmNlc3Rvcikge1xuICAgICAgICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2VsZWN0JykpLlxuICAgICAgICAgICAgY29uY2F0KFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykpKS5cbiAgICAgICAgICAgIGZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChvYmpzW2FuY2VzdG9yXS5jb250YWlucyhpdGVtKSk7XG4gICAgICAgICAgICB9KS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7aWQ6IGl0ZW0uaWQsIHZhbHVlOiBpdGVtLnZhbHVlfTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG4gICAgb25sb2FkOiBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAobG9hZGVkKSByZXR1cm4gZXYoKTtcbiAgICAgICAgbG9hZEV2ZW50cy5wdXNoKGV2KTtcbiAgICB9LFxuICAgIGdldEdlbmVyaWNMaXN0SXRlbTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnZW5lcmljTGlzdEl0ZW0nKVswXS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgfSxcbiAgICBhdHRhY2hFdmVudDogZnVuY3Rpb24oaWQsIHR5cGUsIGZ1bmMpIHtcbiAgICAgICAgaWYgKGlkLmNsb25lTm9kZSkgaWQgPSBlbnN1cmVPYmpJZChpZCk7XG4gICAgICAgIHZhciBmaWQgPSBnZXRJZCgpO1xuICAgICAgICBmdW5jdGlvbnNbZmlkXSA9IHtmOiBmdW5jLCBpZDogaWQsIHR5cGU6IHR5cGV9O1xuICAgICAgICBhcGkub25sb2FkKGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgIG9ianNbaWRdLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZnVuYyk7IFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZpZDtcbiAgICB9LFxuICAgIGRldGFjaEV2ZW50OiBmdW5jdGlvbihmaWQpIHtcbiAgICAgICAgdmFyIGV2ID0gZnVuY3Rpb25zW2ZpZF07XG4gICAgICAgIGlmIChvYmpzW2V2LmlkXS5yZW1vdmVFdmVudExpc3RlbmVyKSBvYmpzW2V2LmlkXS5yZW1vdmVFdmVudExpc3RlbmVyKGV2LnR5cGUsIGV2LmYpO1xuICAgICAgICBkZWxldGUgZnVuY3Rpb25zW2ZpZF07XG4gICAgfSxcbiAgICBkaXNwbGF5OiBmdW5jdGlvbihpZCkge1xuICAgICAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NsaWRlcycpKS5mb3JFYWNoKGZ1bmN0aW9uKG9iaikgeyBlZmZlY3RzLmZhZGVPdXQob2JqKTsgfSk7XG4gICAgICAgIGVmZmVjdHMuZmFkZUluKG9ianNbaWRdKTtcbiAgICB9LFxuICAgIGdldE9iakJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBvYmpzW2lkXTtcbiAgICB9LFxuICAgIGdldEdlbmVyaWNCdXR0b246IGZ1bmN0aW9uKHRleHQsIGNsaWNrLCBtb3VzZW92ZXIpIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBidXR0b24uaW5uZXJUZXh0ID0gdGV4dDtcbiAgICAgICAgaWYgKGNsaWNrKSBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGljayk7XG4gICAgICAgIGlmIChtb3VzZW92ZXIpIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBtb3VzZW92ZXIpO1xuICAgICAgICByZXR1cm4gYnV0dG9uO1xuICAgIH0sXG4gICAgbW9kYWw6IGZ1bmN0aW9uKG1zZykge1xuICAgICAgICBhcGkuZ2V0T2JqQnlJZCgnbW9kYWxNc2cnKS5pbm5lclRleHQgPSBtc2c7XG4gICAgICAgIGVmZmVjdHMuZmFkZUluKGFwaS5nZXRPYmpCeUlkKCdtb2RhbCcpKTtcbiAgICB9LFxuICAgIHVwZGF0ZVdlYXBvbkljb25zOiBmdW5jdGlvbih3ZWFwb25zKSB7XG4gICAgICAgIHZhciBjaGFuZ2VkO1xuICAgICAgICBpZiAod2VhcG9ucykge1xuICAgICAgICAgICAgd2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbikge1xuICAgICAgICAgICAgICAgIGlmICh3ZWFwb25zLnR5cGUgIT09IG9sZFdlYXBvbnMudHlwZSkgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgb2xkV2VhcG9ucyA9IHdlYXBvbnM7XG4gICAgICAgICAgICAgICAgd2VhcG9uSWNvbnMuZm9yRWFjaChmdW5jdGlvbihpY29uKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlYXBvbkljb25zW2luZGV4XS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpY29uRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYuZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXYuZnVuYyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgd2VhcG9ucy5mb3JFYWNoKGZ1bmN0aW9uKHdlYXBvbiwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWFwb24uc2VsZWN0V2VhcG9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgd2VhcG9uSWNvbnNbaW5kZXhdLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHdlYXBvbi5pY29uO1xuICAgICAgICAgICAgICAgICAgICBpY29uRXZlbnRzLnB1c2goe2RvbTogd2VhcG9uSWNvbnNbaW5kZXhdLCBmdW5jOiBjbGlja30pO1xuICAgICAgICAgICAgICAgICAgICB3ZWFwb25JY29ucy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgd2VhcG9uSWNvbnMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpKTtcbiAgICB3ZWFwb25JY29uc1tpXS5jbGFzc05hbWUgPSAnd2VhcG9uaWNvbic7XG4gICAgKGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgdmFyIGogPSBpO1xuICAgICAgICBpZiAob2Jqc1snd2VhcG9uT3B0aW9ucyddKSBhcGkub25sb2FkKGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgIG9ianNbJ3dlYXBvbk9wdGlvbnMnXS5hcHBlbmRDaGlsZCh3ZWFwb25JY29uc1tqXSk7IFxuICAgICAgICB9KTtcbiAgICB9KSgpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4iLCJ2YXIgd2FsbCA9IHJlcXVpcmUoJy4vd2FsbC5qcycpO1xudmFyIG1ha2VTdGFydE9wdGlvbnMgPSByZXF1aXJlKCcuL21ha2VTdGFydE9wdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGRvb3IgPSB3YWxsKG9wdGlvbnMpO1xuICAgIG1ha2VTdGFydE9wdGlvbnMoZG9vcik7XG4gICAgZG9vci5zdGFydE9wdGlvbnMoe3NwZWVkOiBvcHRpb25zLnNwZWVkfSk7XG4gICAgZG9vci50eXBlID0gJ2Rvb3InO1xuICAgIGRvb3Iub3BlblBvcyA9IG9wdGlvbnMub3BlblBvcyB8fCBvcHRpb25zLnBvcztcbiAgICBkb29yLmNsb3NlUG9zID0gb3B0aW9ucy5jbG9zZVBvcyB8fCBvcHRpb25zLnBvcztcbiAgICBkb29yLm9wZW5lZCA9IG9wdGlvbnMub3BlbmVkIHx8IHRydWU7XG5cbiAgICB2YXIgcHJvZ3Jlc3MgPSAoZG9vci5vcGVuZWQpID8gMSA6IDA7XG4gICAgdmFyIHN0YXJ0VGltZTtcbiAgICB2YXIgdXBkYXRlUG9zID0gZnVuY3Rpb24odG9nZ2xlKSB7XG4gICAgICAgIGlmICh0b2dnbGUpIHByb2dyZXNzID0gKGRvb3Iub3BlbmVkKSA/IDEgOiAwO1xuICAgICAgICBkb29yLm1vdmUoe1xuICAgICAgICAgICAgeDogZG9vci5vcGVuUG9zLnggKyAoZG9vci5jbG9zZVBvcy54IC0gZG9vci5vcGVuUG9zLngpICogcHJvZ3Jlc3MsXG4gICAgICAgICAgICB5OiBkb29yLm9wZW5Qb3MueSArIChkb29yLmNsb3NlUG9zLnkgLSBkb29yLm9wZW5Qb3MueSkgKiBwcm9ncmVzcyxcbiAgICAgICAgICAgIHJvdDogZG9vci5vcGVuUG9zLnJvdCArIChkb29yLmNsb3NlUG9zLnJvdCAtIGRvb3Iub3BlblBvcy5yb3QpICogcHJvZ3Jlc3NcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGRvb3IudXBkYXRlUG9zID0gdXBkYXRlUG9zO1xuXG4gICAgdXBkYXRlUG9zKCk7XG5cbiAgICBpZiAoIWRvb3IudmVyYnMpIGRvb3IudmVyYnMgPSB7fTtcbiAgICBkb29yLnZlcmJzLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRvb3Iub3BlbmVkKSB7XG4gICAgICAgICAgICBkb29yLm9wZW5lZCA9IGZhbHNlO1xuICAgICAgICAgICAgZG9vci5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MgLT0gb3B0aW9ucy5zcGVlZDtcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPCAwKSBwcm9ncmVzcyA9IDA7XG4gICAgICAgICAgICAgICAgdXBkYXRlUG9zKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChwcm9ncmVzcyAmJiAhZG9vci5vcGVuZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb29yLm9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICBkb29yLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzcyArPSBvcHRpb25zLnNwZWVkO1xuICAgICAgICAgICAgICAgIGlmIChwcm9ncmVzcyA+IDEpIHByb2dyZXNzID0gMTtcbiAgICAgICAgICAgICAgICB1cGRhdGVQb3MoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHByb2dyZXNzIC0gMSAmJiBkb29yLm9wZW5lZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZG9vcjtcbn07XG5cbiIsInZhciBtYWtlU3RhcnRPcHRpb25zID0gcmVxdWlyZSgnLi9tYWtlU3RhcnRPcHRpb25zLmpzJyk7XG52YXIgcG9zdCA9IHJlcXVpcmUoJy4vcG9zdC5qcycpO1xudmFyIHRlc3RPYmogPSByZXF1aXJlKCcuL3Rlc3Qtb2JqLmpzJyk7XG52YXIgd29ybGQgPSByZXF1aXJlKCcuL3dvcmxkLmpzJyk7XG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xudmFyIGdldElkID0gcmVxdWlyZSgnLi9nZXRJZC5qcycpLmdldElkO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi9kb20uanMnKTtcbnZhciBlZGl0aW5nT2JqID0gZmFsc2U7XG52YXIgZHJhZ2dpbmdPYmogPSBmYWxzZTtcbnZhciB3b3JsZEluc3BlY3RvckZpZHMgPSBbXTtcbnZhciBjbGlja09iaiA9IHt9O1xudmFyIGNhbWVyYSA9IHRlc3RPYmooe3Bvczoge1xuICAgIHg6IDEwMDAsXG4gICAgeTogMTAwMFxufX0pO1xuY2FtZXJhLmNhbWVyYSA9IHRydWU7XG5jYW1lcmEubG9hZCgpO1xuY2FtZXJhLnN0ZXAoKTtcblxuZnVuY3Rpb24gcGF1c2VFdmVudChlKXtcbiAgICBpZihlLnN0b3BQcm9wYWdhdGlvbikgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBpZihlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5jYW5jZWxCdWJibGU9dHJ1ZTtcbiAgICBlLnJldHVyblZhbHVlPWZhbHNlO1xuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbnZhciBzY3JlZW5XaWR0aCA9IGNhbnZhcy5jbGllbnRXaWR0aDtcbnZhciBzY3JlZW5IZWlnaHQgPSBjYW52YXMuY2xpZW50SGVpZ2h0O1xudmFyIG1vdXNlUG9zID0ge3g6IDAsIHk6IDB9O1xudmFyIG1lbnVJdGVtcyA9IHtcbiAgICB0eXBlOiB7XG4gICAgICAgIGRvb3I6IFtdLFxuICAgICAgICBhcmVhOiBbXVxuICAgIH0sXG4gICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgc3F1YXJlOiBbXSxcbiAgICAgICAgY2lyY2xlOiBbXVxuICAgIH0sXG4gICAgYmFzZToge1xuICAgICAgICBzcGF3bmVyOiBbXVxuICAgIH1cbn07XG5cbnZhciBzdGF0ZSA9ICdub01lbnVzJztcbnZhciBzdGF0ZXMgPSB7XG4gICAgbm9NZW51czogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5oaWRlTWVudSgpO1xuICAgIH0sXG4gICAgZWRpdGluZ09iajogZnVuY3Rpb24oZXYsIG9iaikge1xuICAgICAgICBpZiAoIW9iaikgb2JqID0gY2xpY2tPYmo7XG4gICAgICAgIGRvbS5oaWRlTWVudSgpO1xuICAgICAgICBkb20uY2xlYXJJbnB1dHMoJ29iakluc3BlY3RvcicpO1xuICAgICAgICBkb20uY2xlYXJMaXN0SXRlbXMoJ29iakluc3BlY3RvcicpO1xuICAgICAgICBlZGl0aW5nT2JqID0gb2JqO1xuICAgICAgICB1cGRhdGVPYmpJbnNwZWN0b3JPcHRpb25zKCk7XG4gICAgICAgIGRvbS5zaG93TWVudSgnb2JqSW5zcGVjdG9yJyk7XG4gICAgICAgIHVwZGF0ZU9iakluc3BlY3RvcigpO1xuICAgICAgICBmb2N1c09uRWRpdGluZ09iaigpO1xuICAgICAgICBkb20ub25IaWRlTWVudSgnb2JqSW5zcGVjdG9yJywgZnVuY3Rpb24oKSB7IGVkaXRpbmdPYmogPSBudWxsOyB9KTtcbiAgICB9LFxuICAgIGxldmVsTWVudTogZnVuY3Rpb24oZ2FtZVBvcywgY2FudmFzUG9zKSB7XG4gICAgICAgIGRvbS5oaWRlTWVudSgpO1xuICAgICAgICBkb20uc2hvd01lbnUoJ2xldmVsTWVudScsIGNhbnZhc1Bvcyk7XG4gICAgICAgIGRvbS5jbGVhckxpc3RJdGVtcygnbGV2ZWxNZW51T2JqcycpO1xuICAgICAgICB2YXIgZmlkID0gZG9tLmF0dGFjaEV2ZW50KCdsZXZlbE1lbnUnLCAnbW91c2VvdXQnLCBmdW5jdGlvbihldikge1xuICAgICAgICAgICAgaWYgKGRvbS5nZXRPYmpCeUlkKCdsZXZlbE1lbnUnKS5jb250YWlucyhldi50b0VsZW1lbnQpKSByZXR1cm47XG4gICAgICAgICAgICB1cGRhdGVTdGF0ZSgnbm9NZW51cycpO1xuICAgICAgICB9KTtcbiAgICAgICAgZG9tLm9uSGlkZU1lbnUoJ2xldmVsTWVudScsIGZ1bmN0aW9uKCkgeyBkb20uZGV0YWNoRXZlbnQoZmlkKTsgfSk7XG4gICAgICAgIGdldENvbGxpZGluZ09ianMoY2xpY2tPYmopLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgZG9tLmFkZE1lbnVMaXN0SXRlbSgnbGV2ZWxNZW51T2JqcycsIChpdGVtLnR5cGUgKyAnICAnICsgaXRlbS5pZCksIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgICAgICAgICAgZG9tLmhpZGVNZW51KCdsZXZlbE1lbnUnKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0ZSgnZWRpdGluZ09iaicsIGV2LCBpdGVtKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG52YXIgdXBkYXRlU3RhdGUgPSBmdW5jdGlvbihuZXdTdGF0ZSkge1xuICAgIHN0YXRlID0gbmV3U3RhdGU7XG4gICAgc3RhdGVzW3N0YXRlXS5hcHBseShudWxsLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xufTtcblxudmFyIGdldENvbGxpZGluZ09ianMgPSBmdW5jdGlvbih0ZXN0T2JqKSB7XG4gICAgcmV0dXJuIHdvcmxkLmdldEl0ZW1zKCkuZmlsdGVyKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICByZXR1cm4gKG9iai5kZXRlY3RDb2xsaWRlKHRlc3RPYmopKTtcbiAgICB9KTtcbn07XG5cbnZhciB1cGRhdGVPYmpJbnNwZWN0b3IgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWVkaXRpbmdPYmopIHJldHVybjtcbiAgICBkb20uZ2V0T2JqQnlJZCgnb2JqVHlwZScpLnZhbHVlID0gZWRpdGluZ09iai50eXBlO1xuICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpOYW1lJykudmFsdWUgPSBlZGl0aW5nT2JqLmdldE9iak5hbWUoKTtcbiAgICBkb20uZ2V0T2JqQnlJZCgnb2JqWFBvcycpLnZhbHVlID0gZWRpdGluZ09iai5wb3MueDtcbiAgICBkb20uZ2V0T2JqQnlJZCgnb2JqWVBvcycpLnZhbHVlID0gZWRpdGluZ09iai5wb3MueTtcbiAgICBkb20uZ2V0T2JqQnlJZCgnb2JqUm90YXRpb24nKS52YWx1ZSA9IGVkaXRpbmdPYmoucG9zLnJvdDtcbiAgICBpZiAoZWRpdGluZ09iai5yYWRpdXMpIGRvbS5nZXRPYmpCeUlkKCdvYmpSYWRpdXMnKS52YWx1ZSA9IGVkaXRpbmdPYmoucmFkaXVzO1xuICAgIGlmIChlZGl0aW5nT2JqLndpZHRoKSB7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpXaWR0aCcpLnZhbHVlID0gZWRpdGluZ09iai53aWR0aDtcbiAgICAgICAgZG9tLmdldE9iakJ5SWQoJ29iakhlaWdodCcpLnZhbHVlID0gZWRpdGluZ09iai5oZWlnaHQ7XG4gICAgfVxuICAgIGlmIChlZGl0aW5nT2JqLmJhc2UgPT09ICdzcGF3bmVyJykge1xuICAgICAgICBkb20uZ2V0T2JqQnlJZCgnb2JqU3RhcnQnKS52YWx1ZSA9IGVkaXRpbmdPYmouc3RhcnRPcHRpb25zKCkuc3RhcnQ7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpJbnRlcnZhbCcpLnZhbHVlID0gZWRpdGluZ09iai5zdGFydE9wdGlvbnMoKS5pbnRlcnZhbDtcbiAgICAgICAgZG9tLmdldE9iakJ5SWQoJ29ialNwYXduQ291bnQnKS52YWx1ZSA9IGVkaXRpbmdPYmouc3RhcnRPcHRpb25zKCkuc3Bhd25Db3VudDtcbiAgICB9XG4gICAgaWYgKGVkaXRpbmdPYmoudHlwZSA9PT0gJ2Rvb3InKSB7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpTcGVlZCcpLnZhbHVlID0gZWRpdGluZ09iai5zdGFydE9wdGlvbnMoKS5zcGVlZDtcbiAgICAgICAgZG9tLmdldE9iakJ5SWQoJ29iakNsb3NlUG9zWCcpLnZhbHVlID0gZWRpdGluZ09iai5jbG9zZVBvcy54O1xuICAgICAgICBkb20uZ2V0T2JqQnlJZCgnb2JqQ2xvc2VQb3NZJykudmFsdWUgPSBlZGl0aW5nT2JqLmNsb3NlUG9zLnk7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpDbG9zZVBvc1JvdCcpLnZhbHVlID0gZWRpdGluZ09iai5jbG9zZVBvcy5yb3Q7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpPcGVuUG9zWCcpLnZhbHVlID0gZWRpdGluZ09iai5vcGVuUG9zLng7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpPcGVuUG9zWScpLnZhbHVlID0gZWRpdGluZ09iai5vcGVuUG9zLnk7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpPcGVuUG9zUm90JykudmFsdWUgPSBlZGl0aW5nT2JqLm9wZW5Qb3Mucm90O1xuICAgIH1cbiAgICBpZiAoZWRpdGluZ09iai50eXBlID09PSAnYXJlYScpIHtcbiAgICAgICAgZG9tLmNsZWFyTGlzdEl0ZW1zKCdleGlzdGluZ1RyaWdnZXJzTGlzdCcpO1xuICAgICAgICBlZGl0aW5nT2JqLmdldE9iakV2ZW50KCkuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgbGkgPSBkb20uZ2V0R2VuZXJpY0xpc3RJdGVtKCk7XG4gICAgICAgICAgICBsaS5pbm5lclRleHQgPSBpdGVtLnRyaWdnZXIgKyAnIC0gJyArIGl0ZW0ubm93biArICcgLSAnICsgaXRlbS52ZXJiO1xuICAgICAgICAgICAgbGkuYXBwZW5kQ2hpbGQoZG9tLmdldEdlbmVyaWNCdXR0b24oJ1gnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBlZGl0aW5nT2JqLmRlbGV0ZU9iakV2ZW50KGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU9iakluc3BlY3RvcigpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7fSkpO1xuICAgICAgICAgICAgZG9tLmdldE9iakJ5SWQoJ2V4aXN0aW5nVHJpZ2dlcnNMaXN0JykuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG52YXIgdXBkYXRlT2JqSW5zcGVjdG9yT3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChlZGl0aW5nT2JqLmJhc2UgPT09ICdzcGF3bmVyJykgbWVudUl0ZW1zLmJhc2Uuc3Bhd25lci5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZG9tLmFkZExpc3RJdGVtKCdvYmpJbnNwZWN0b3InLCBpdGVtKTtcbiAgICB9KTtcbiAgICBpZiAoZWRpdGluZ09iai5nZW9tZXRyeSkgbWVudUl0ZW1zLmdlb21ldHJ5W2VkaXRpbmdPYmouZ2VvbWV0cnldLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBkb20uYWRkTGlzdEl0ZW0oJ29iakluc3BlY3RvcicsIGl0ZW0pO1xuICAgIH0pO1xuICAgIGlmIChlZGl0aW5nT2JqLnR5cGUgPT09ICdkb29yJykgbWVudUl0ZW1zLnR5cGUuZG9vci5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgZG9tLmFkZExpc3RJdGVtKCdvYmpJbnNwZWN0b3InLCBpdGVtKTtcbiAgICB9KTtcbiAgICBpZiAoZWRpdGluZ09iai50eXBlID09PSAnYXJlYScpIG1lbnVJdGVtcy50eXBlLmFyZWEuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGRvbS5hZGRMaXN0SXRlbSgnb2JqSW5zcGVjdG9yJywgaXRlbSk7XG4gICAgfSk7XG59O1xuXG52YXIgdXBkYXRlRWRpdGluZ09iaiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghZWRpdGluZ09iaikgcmV0dXJuO1xuICAgIHZhciB2YWx1ZXMgPSB7fTtcbiAgICBkb20uZ2V0SW5wdXRzVmFsdWVzKCdvYmpJbnNwZWN0b3InKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFsdWVzW2l0ZW0uaWRdID0gaXRlbS52YWx1ZTtcbiAgICB9KTtcbiAgICB2YXIgbmV3T2JqO1xuICAgIGlmICh2YWx1ZXMub2JqVHlwZSAhPT0gZWRpdGluZ09iai50eXBlKSB7XG4gICAgICAgIG5ld09iaiA9IHdvcmxkLmxvYWRJdGVtcyh7XG4gICAgICAgICAgICBlbnRpdHk6IHZhbHVlcy5vYmpUeXBlLFxuICAgICAgICAgICAgcG9zOiB7XG4gICAgICAgICAgICAgICAgeDogZWRpdGluZ09iai5wb3MueCxcbiAgICAgICAgICAgICAgICB5OiBlZGl0aW5nT2JqLnBvcy55XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBlZGl0aW5nT2JqLnVubG9hZCgpO1xuICAgICAgICBlZGl0aW5nT2JqID0gbmV3T2JqO1xuICAgICAgICBkb20uY2xlYXJMaXN0SXRlbXMoJ29iakluc3BlY3RvcicpO1xuICAgICAgICB3b3JsZC51cGRhdGVOZXdJdGVtcygpO1xuICAgICAgICB1cGRhdGVPYmpJbnNwZWN0b3JPcHRpb25zKCk7XG4gICAgICAgIHVwZGF0ZU9iakluc3BlY3RvcigpO1xuICAgICAgICB2YWx1ZXMgPSB7fTtcbiAgICAgICAgZG9tLmdldElucHV0c1ZhbHVlcygnb2JqSW5zcGVjdG9yJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YWx1ZXNbaXRlbS5pZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGVkaXRpbmdPYmoudHlwZSAhPT0gJ2Rvb3InKSBlZGl0aW5nT2JqLm1vdmUoe3g6IHBhcnNlSW50KHZhbHVlcy5vYmpYUG9zKSwgeTogcGFyc2VJbnQodmFsdWVzLm9iallQb3MpLCByb3Q6IHBhcnNlRmxvYXQodmFsdWVzLm9ialJvdGF0aW9uKX0pO1xuICAgIGlmICh2YWx1ZXMub2JqTmFtZSkgZWRpdGluZ09iai5zZXRPYmpOYW1lKHZhbHVlcy5vYmpOYW1lKTtcbiAgICBpZiAodmFsdWVzLm9ialJhZGl1cykgZWRpdGluZ09iai5yYWRpdXMgPSBwYXJzZUludCh2YWx1ZXMub2JqUmFkaXVzKTtcbiAgICBpZiAodmFsdWVzLm9ialdpZHRoKSBlZGl0aW5nT2JqLnNldERpbWVuc2lvbnMoe3dpZHRoOiB2YWx1ZXMub2JqV2lkdGgsIGhlaWdodDogdmFsdWVzLm9iakhlaWdodH0pO1xuICAgIGlmIChlZGl0aW5nT2JqLmJhc2UgPT09ICdzcGF3bmVyJykgZWRpdGluZ09iai5zdGFydE9wdGlvbnMoe1xuICAgICAgICBzdGFydDogdmFsdWVzLm9ialN0YXJ0LFxuICAgICAgICBpbnRlcnZhbDogdmFsdWVzLm9iakludGVydmFsLFxuICAgICAgICBzcGF3bkNvdW50OiB2YWx1ZXMub2JqU3Bhd25Db3VudFxuICAgIH0pO1xuICAgIGlmIChlZGl0aW5nT2JqLnR5cGUgPT09ICdkb29yJykge1xuICAgICAgICBlZGl0aW5nT2JqLmNsb3NlUG9zID0ge3g6IHBhcnNlSW50KHZhbHVlcy5vYmpDbG9zZVBvc1gpLCB5OiBwYXJzZUludCh2YWx1ZXMub2JqQ2xvc2VQb3NZKSwgcm90OiBwYXJzZUZsb2F0KHZhbHVlcy5vYmpDbG9zZVBvc1JvdCl9O1xuICAgICAgICBlZGl0aW5nT2JqLm9wZW5Qb3MgPSB7eDogcGFyc2VJbnQodmFsdWVzLm9iak9wZW5Qb3NYKSwgeTogcGFyc2VJbnQodmFsdWVzLm9iak9wZW5Qb3NZKSwgcm90OiBwYXJzZUZsb2F0KHZhbHVlcy5vYmpPcGVuUG9zUm90KX07XG4gICAgICAgIGVkaXRpbmdPYmoub3BlbmVkID0gdmFsdWVzLm9iak9wZW5lZDtcbiAgICAgICAgZWRpdGluZ09iai5zdGFydE9wdGlvbnMoeyBzcGVlZDogdmFsdWVzLm9ialNwZWVkIH0pO1xuICAgICAgICBlZGl0aW5nT2JqLnVwZGF0ZVBvcygpO1xuICAgIH1cbiAgICBpZiAoZWRpdGluZ09iai50eXBlID09PSAnYXJlYScpIHtcblxuICAgIH1cblxuICAgIGVkaXRpbmdPYmoucHJvY2Vzc01vdmVtZW50RXZlbnRzKCk7XG59O1xuXG52YXIgZGVsZXRlRWRpdGluZ09iaiA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRpbmdPYmoudW5sb2FkKCk7XG4gICAgdXBkYXRlU3RhdGUoJ25vTWVudXMnKTtcbn07XG5cbnZhciBjbG9uZUVkaXRpbmdPYmogPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3T2JqID0gd29ybGQubG9hZEl0ZW1zKHtcbiAgICAgICAgZW50aXR5OiBlZGl0aW5nT2JqLnR5cGUsXG4gICAgICAgIHBvczoge1xuICAgICAgICAgICAgeDogZWRpdGluZ09iai5wb3MueCwgXG4gICAgICAgICAgICB5OiBlZGl0aW5nT2JqLnBvcy55LFxuICAgICAgICAgICAgcm90OiBlZGl0aW5nT2JqLnBvcy5yb3RcbiAgICAgICAgfSxcbiAgICAgICAgd2lkdGg6IGVkaXRpbmdPYmoud2lkdGgsXG4gICAgICAgIGhlaWdodDogZWRpdGluZ09iai5oZWlnaHRcbiAgICB9KTtcbiAgICBpZiAoZWRpdGluZ09iai5zdGFydE9wdGlvbnMpIHtcbiAgICAgICAgbmV3T2JqLnN0YXJ0T3B0aW9ucyhlZGl0aW5nT2JqLnN0YXJ0T3B0aW9ucygpKTtcbiAgICB9XG4gICAgd29ybGQudXBkYXRlTmV3SXRlbXMoKTtcbiAgICBuZXdPYmoucHJvY2Vzc01vdmVtZW50RXZlbnRzKCk7XG4gICAgbmV3T2JqLmxvYWQoKTtcbn07XG5cbnZhciB0cmFuc2xhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvcykge1xuICAgIHZhciBjYW52YXNQb3MgPSB7XG4gICAgICAgIHg6IHBvcy54ICogKHdvcmxkLmNhbnZhc0RpbS54IC8gc2NyZWVuV2lkdGgpLFxuICAgICAgICB5OiBwb3MueSAqICh3b3JsZC5jYW52YXNEaW0ueSAvIHNjcmVlbkhlaWdodClcbiAgICB9O1xuICAgIHZhciBnYW1lUG9zID0ge1xuICAgICAgICB4OiBjYW52YXNQb3MueCAtICh3b3JsZC5jYW52YXNEaW0ueCAvIDIgLSBjYW1lcmEucG9zLngpLFxuICAgICAgICB5OiBjYW52YXNQb3MueSAtICh3b3JsZC5jYW52YXNEaW0ueSAvIDIgLSBjYW1lcmEucG9zLnkpXG4gICAgfVxuICAgIHJldHVybiBnYW1lUG9zO1xufTtcblxudmFyIGNhbnZhc0NsaWNrID0gZnVuY3Rpb24oZXYpIHtcbiAgICAvL2V2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgcGF1c2VFdmVudChldik7XG4gICAgdmFyIHN0YXJ0TW91c2VQb3MgPSB7eDogZXYuY2xpZW50WCwgeTogZXYuY2xpZW50WX07XG4gICAgdmFyIHN0YXJ0R2FtZVBvcyA9IHRyYW5zbGF0ZVBvc2l0aW9uKHN0YXJ0TW91c2VQb3MpO1xuICAgIHZhciBzdGFydE9ialBvcztcbiAgICBjbGlja09iaiA9IHRlc3RPYmooe3Bvczogc3RhcnRHYW1lUG9zfSk7XG4gICAgY2xpY2tPYmoubG9hZCgpO1xuICAgIGNsaWNrT2JqLnN0ZXAoKTtcbiAgICBpZiAoZXYuYnV0dG9uID09PSAyKSB1cGRhdGVTdGF0ZSgnbGV2ZWxNZW51Jywgc3RhcnRHYW1lUG9zLCB7eDogZXYuY2xpZW50WCwgeTogZXYuY2xpZW50WX0pO1xuICAgIGlmIChldi5idXR0b24gPT09IDApIHtcbiAgICAgICAgaWYgKGVkaXRpbmdPYmogJiYgZ2V0Q29sbGlkaW5nT2JqcyhjbGlja09iaikuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIChpdGVtLmlkID09PSBlZGl0aW5nT2JqLmlkKTsgfSkubGVuZ3RoKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ09iaiA9IGVkaXRpbmdPYmo7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnZ2luZ09iaiA9IGFwaS5jYW1lcmE7XG4gICAgICAgIH1cbiAgICAgICAgc3RhcnRPYmpQb3MgPSB7eDogZHJhZ2dpbmdPYmoucG9zLngsIHk6IGRyYWdnaW5nT2JqLnBvcy55fTtcbiAgICAgICAgdmFyIG1vdXNlbW92ZUZpZCA9IGRvbS5hdHRhY2hFdmVudCgnd2luZG93JywgJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgICAgICBwYXVzZUV2ZW50KGV2KTtcbiAgICAgICAgICAgIHZhciBnYW1lUG9zID0gdHJhbnNsYXRlUG9zaXRpb24oe3g6IGV2LmNsaWVudFgsIHk6IGV2LmNsaWVudFl9KTtcbiAgICAgICAgICAgIHZhciBnYW1lUG9zRGVsdGEgPSB7eDogKGdhbWVQb3MueCAtIHN0YXJ0R2FtZVBvcy54KSwgeTogKGdhbWVQb3MueSAtIHN0YXJ0R2FtZVBvcy55KX07XG4gICAgICAgICAgICBpZiAoZHJhZ2dpbmdPYmouY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgZHJhZ2dpbmdPYmoubW92ZSh7eDogIChzdGFydE9ialBvcy54IC0gZ2FtZVBvc0RlbHRhLngpLCB5OiAgKHN0YXJ0T2JqUG9zLnkgLSBnYW1lUG9zRGVsdGEueSl9KTtcbiAgICAgICAgICAgICAgICBzdGFydE9ialBvcyA9IHt4OiBkcmFnZ2luZ09iai5wb3MueCwgeTogZHJhZ2dpbmdPYmoucG9zLnl9O1xuICAgICAgICAgICAgICAgIHN0YXJ0R2FtZVBvcyA9IGdhbWVQb3M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRyYWdnaW5nT2JqLm1vdmUoe3g6IHN0YXJ0T2JqUG9zLnggKyBnYW1lUG9zRGVsdGEueCwgeTogc3RhcnRPYmpQb3MueSArIGdhbWVQb3NEZWx0YS55fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkcmFnZ2luZ09iai5wcm9jZXNzTW92ZW1lbnRFdmVudHMoKTtcbiAgICAgICAgICAgIHVwZGF0ZU9iakluc3BlY3RvcigpO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIG1vdXNldXBGaWQgPSBkb20uYXR0YWNoRXZlbnQoJ3dpbmRvdycsICdtb3VzZXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkb20uZGV0YWNoRXZlbnQobW91c2Vtb3ZlRmlkKTtcbiAgICAgICAgICAgIGRvbS5kZXRhY2hFdmVudChtb3VzZXVwRmlkKTtcbiAgICAgICAgICAgIGRyYWdnaW5nT2JqID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbnZhciB1cGRhdGVXb3JsZEluc3BlY3RvciA9IGZ1bmN0aW9uKCkge1xuICAgIGRvbS5nZXRPYmpCeUlkKCdlbnRpdHlDb3VudCcpLmlubmVyVGV4dCA9IHdvcmxkLmdldEl0ZW1zKCkubGVuZ3RoO1xuICAgIGRvbS5jbGVhckxpc3RJdGVtcygnd29ybGRJbnNwZWN0b3InKTtcbiAgICB3b3JsZEluc3BlY3RvckZpZHMuZm9yRWFjaChmdW5jdGlvbihmaWQpIHsgZG9tLmRldGFjaEV2ZW50KGZpZCk7IH0pO1xuICAgIHdvcmxkSW5zcGVjdG9yRmlkcyA9IFtdO1xuICAgIHdvcmxkLmdldEl0ZW1zKCkuZm9yRWFjaChmdW5jdGlvbihlbnRpdHkpIHtcbiAgICAgICAgdmFyIGxpID0gZG9tLmdldEdlbmVyaWNMaXN0SXRlbSgpO1xuICAgICAgICBsaS5pbm5lclRleHQgPSBlbnRpdHkuYmFzZSArICcsICcgKyBlbnRpdHkudHlwZSArICcsICcgKyBlbnRpdHkuaWQ7XG4gICAgICAgIHdvcmxkSW5zcGVjdG9yRmlkcy5wdXNoKGRvbS5hdHRhY2hFdmVudChsaSwgJ2NsaWNrJywgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgICAgIHVwZGF0ZVN0YXRlKCdlZGl0aW5nT2JqJywgZXYsIGVudGl0eSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZG9tLmFkZExpc3RJdGVtKCd3b3JsZEluc3BlY3RvcicsIGxpLmlkKTtcbiAgICB9KTtcbn07XG5cbnZhciBmb2N1c09uRWRpdGluZ09iaiA9IGZ1bmN0aW9uKCkge1xuICAgIGNhbWVyYS5tb3ZlKGVkaXRpbmdPYmoucG9zKTtcbn07XG5cbnZhciBzYXZlTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgd29ybGQuZ2V0SXRlbXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgb3V0cHV0LnB1c2goaXRlbS5nZXRJbml0aWFsQ29uZGl0aW9ucygpKTtcbiAgICB9KTtcbiAgICBwb3N0KCcuL2xldmVscy8nLCB7XG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG91dHB1dCksXG4gICAgICAgIG5hbWU6IHdvcmxkLmdldExldmVsTWV0YWRhdGEoKS5uYW1lLFxuICAgICAgICBpZDogd29ybGQuZ2V0TGV2ZWxNZXRhZGF0YSgpLmlkXG4gICAgfSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgZG9tLm1vZGFsKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XG4gICAgICAgIHdvcmxkLnNldExldmVsTWV0YWRhdGEocmVzcG9uc2UpO1xuICAgIH0pO1xuICAgIHVwZGF0ZVN0YXRlKCdub01lbnVzJyk7XG59O1xuXG52YXIgdXBkYXRlTGV2ZWxOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgZG9tLmdldE9iakJ5SWQoJ2xldmVsTmFtZScpLnZhbHVlID0gd29ybGQuZ2V0TGV2ZWxNZXRhZGF0YSgpLm5hbWU7XG59O1xuXG5cbnZhciBsZXZlbE5hbWVJbnB1dENoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICB3b3JsZC5zZXRMZXZlbE1ldGFkYXRhKHtuYW1lOiBkb20uZ2V0SW5wdXRzVmFsdWVzKCdsZXZlbE5hbWUnKVswXS52YWx1ZX0pO1xufTtcblxudmFyIGFkZFRyaWdnZXIgPSBmdW5jdGlvbigpIHtcblxufTtcblxuZG9tLmF0dGFjaEV2ZW50KCdjYW52YXMnLCAnbW91c2Vkb3duJywgY2FudmFzQ2xpY2spO1xuZG9tLmF0dGFjaEV2ZW50KCduZXdMZXZlbCcsICdjbGljaycsIGV2ZW50cy5lbWl0LmJpbmQobnVsbCwgJ25ld0xldmVsJykpO1xuZG9tLmF0dGFjaEV2ZW50KCduZXdPYmplY3QnLCAnY2xpY2snLCB1cGRhdGVTdGF0ZS5iaW5kKG51bGwsICdlZGl0aW5nT2JqJykpO1xuZG9tLmF0dGFjaEV2ZW50KCdjbG9uZU9iaicsICdjbGljaycsIGNsb25lRWRpdGluZ09iaik7XG5kb20uYXR0YWNoRXZlbnQoJ2RlbGV0ZU9iaicsICdjbGljaycsIGRlbGV0ZUVkaXRpbmdPYmopO1xuZG9tLmF0dGFjaEV2ZW50KCdmb2N1c09iaicsICdjbGljaycsIGZvY3VzT25FZGl0aW5nT2JqKTtcbmRvbS5hdHRhY2hFdmVudCgnbGV2ZWxOYW1lJywgJ2NoYW5nZScsIGxldmVsTmFtZUlucHV0Q2hhbmdlZCk7XG5kb20uYXR0YWNoRXZlbnQoJ3NhdmVMZXZlbCcsICdjbGljaycsIHNhdmVMZXZlbCk7XG5kb20uYXR0YWNoRXZlbnQoJ2FkZFRyaWdnZXJCdXR0b24nLCAnY2xpY2snLCBhZGRUcmlnZ2VyKTtcbmRvbS5hdHRhY2hFdmVudCgnbWFpbk1lbnVCdXR0b24nLCAnY2xpY2snLCBldmVudHMuZW1pdC5iaW5kKG51bGwsICdtYWluTWVudScpKTtcbmRvbS5vbmxvYWQoZnVuY3Rpb24oKSB7XG4gICAgZG9tLnNob3dNZW51KCd3b3JsZEluc3BlY3RvcicpO1xuICAgIHdvcmxkLmdldEVudGl0eVR5cGVzKCkuZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciB2YWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgdmFsLmlubmVyVGV4dCA9IHR5cGU7XG4gICAgICAgIGRvbS5nZXRPYmpCeUlkKCdvYmpUeXBlJykuYXBwZW5kQ2hpbGQodmFsKTtcbiAgICB9KTtcbiAgICBkb20uZ2V0SXRlbXNCeUNsYXNzKCdkb29yVHlwZScpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBtZW51SXRlbXMudHlwZS5kb29yLnB1c2goaXRlbSk7XG4gICAgfSk7XG4gICAgZG9tLmdldEl0ZW1zQnlDbGFzcygnYXJlYVR5cGUnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgbWVudUl0ZW1zLnR5cGUuYXJlYS5wdXNoKGl0ZW0pO1xuICAgIH0pO1xuICAgIGRvbS5nZXRJdGVtc0J5Q2xhc3MoJ2NpcmNsZUdlb21ldHJ5JykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIG1lbnVJdGVtcy5nZW9tZXRyeS5jaXJjbGUucHVzaChpdGVtKTtcbiAgICB9KTtcbiAgICBkb20uZ2V0SXRlbXNCeUNsYXNzKCdzcXVhcmVHZW9tZXRyeScpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBtZW51SXRlbXMuZ2VvbWV0cnkuc3F1YXJlLnB1c2goaXRlbSk7XG4gICAgfSk7XG4gICAgZG9tLmdldEl0ZW1zQnlDbGFzcygnc3Bhd25lckJhc2UnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgbWVudUl0ZW1zLmJhc2Uuc3Bhd25lci5wdXNoKGl0ZW0pO1xuICAgIH0pO1xuICAgIGRvbS5nZXRJbnB1dHNWYWx1ZXMoJ29iakluc3BlY3RvcicpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBkb20uYXR0YWNoRXZlbnQoaXRlbS5pZCwgJ2NoYW5nZScsIHVwZGF0ZUVkaXRpbmdPYmopO1xuICAgIH0pO1xufSk7XG5cbmV2ZW50cy5yZWdpc3RlcignZW50aXR5Q291bnQnLCB1cGRhdGVXb3JsZEluc3BlY3RvciwgZ2V0SWQoKSk7XG5ldmVudHMucmVnaXN0ZXIoJ3VwZGF0ZUxldmVsTmFtZScsIHVwZGF0ZUxldmVsTmFtZSwgZ2V0SWQoKSk7XG5cbmFwaSA9IHtcbiAgICBjYW1lcmE6IGNhbWVyYVxufTtcblxudXBkYXRlU3RhdGUoc3RhdGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiIsInJlcXVpcmUoJy4vYW5pbWF0aW9uU2hpbS5qcycpO1xudmFyIHBvc3QgPSByZXF1aXJlKCcuL3Bvc3QuanMnKTtcbndpbmRvdy5sb2dnaW5nID0gW107XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBtYWtlSW5pdGlhbENvbmRpdGlvbnNTYXZhYmxlID0gcmVxdWlyZSgnLi9tYWtlSW5pdGlhbENvbmRpdGlvbnNTYXZhYmxlLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi9kb20uanMnKTtcbnZhciByZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXIuanMnKTtcbndpbmRvdy53b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbnZhciBnZXRJZCA9IHJlcXVpcmUoJy4vZ2V0SWQuanMnKS5nZXRJZDtcbnZhciBjb250cm9sbGVyID0gcmVxdWlyZSgnLi9lZGl0b3ItY29udHJvbGxlci5qcycpO1xudmFyIGdldCA9IHJlcXVpcmUoJy4vZ2V0LmpzJyk7XG53aW5kb3cudV9pZCA9ICcnO1xuXG5nZXQoJy4vaWQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgdV9pZCA9IGRhdGEuX2lkO1xufSk7XG5cbmRvbS5vbmxvYWQoZnVuY3Rpb24oKSB7XG5cbiAgICByZW5kZXJlci5jb25uZWN0Q2FtZXJhKGNvbnRyb2xsZXIuY2FtZXJhKTtcbiAgICB2YXIgY3VycmVudEdhbWVJZCA9IGdldElkKCk7XG4gICAgd29ybGQuZGVjb3JhdGVBbGxJdGVtcyhtYWtlSW5pdGlhbENvbmRpdGlvbnNTYXZhYmxlKTtcblxuICAgIHZhciBzdGF0ZXMgPSB7XG4gICAgICAgIG1haW5NZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRvbS5kaXNwbGF5KCdtYWluTWVudScpO1xuICAgICAgICAgICAgZG9tLmNsZWFyTGlzdEl0ZW1zKCdvd25lckxldmVscycpO1xuICAgICAgICAgICAgZG9tLmNsZWFyTGlzdEl0ZW1zKCdwdWJsaWNMZXZlbHMnKTtcbiAgICAgICAgICAgIGdldCgnLi9sZXZlbHMvJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdCA9ICdvd25lckxldmVscyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZXZlbC5zbmFwc2hvdCkgbGlzdCA9ICdwdWJsaWNMZXZlbHMnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb20uYWRkTWVudUxpc3RJdGVtKGxpc3QsIGxldmVsLm5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzLmxvYWRMZXZlbChsZXZlbC5pZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWxldmVsLnNuYXBzaG90KSBkb20uZ2V0T2JqQnlJZChsaSkuYXBwZW5kQ2hpbGQoZG9tLmdldEdlbmVyaWNCdXR0b24oJ2RlbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdCgnLi9sZXZlbHMvZGVsZXRlLycsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXZlbElkOiBsZXZlbC5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlcy5tYWluTWVudSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsZXZlbC5zbmFwc2hvdCkgZG9tLmdldE9iakJ5SWQobGkpLmFwcGVuZENoaWxkKGRvbS5nZXRHZW5lcmljQnV0dG9uKCdwdWJsaXNoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0KCcuL2xldmVscy9wdWJsaXNoLycsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXZlbElkOiBsZXZlbC5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlcy5tYWluTWVudSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBuZXdMZXZlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3b3JsZC51bmxvYWRXb3JsZCgpO1xuICAgICAgICAgICAgc3RhdGVzLmVkaXRpbmdMZXZlbCgpO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkTGV2ZWw6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICB3b3JsZC5sb2FkTGV2ZWwoaWQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHN0YXRlcy5lZGl0aW5nTGV2ZWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBlZGl0aW5nTGV2ZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZG9tLmRpc3BsYXkoJ2dhbWVWaWV3Jyk7XG4gICAgICAgICAgICBldmVudHMucmVnaXN0ZXIoJ2FuaW1hdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJlci5zdGVwKCk7XG4gICAgICAgICAgICB9LCBjdXJyZW50R2FtZUlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGF1c2VkTGV2ZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZG9tLmRpc3BsYXkoJ3BhdXNlTWVudScpO1xuICAgICAgICAgICAgZXZlbnRzLnVucmVnaXN0ZXIoY3VycmVudEdhbWVJZCk7XG4gICAgICAgICAgICBjdXJyZW50R2FtZUlkID0gZ2V0SWQoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBcbiAgICBldmVudHMucmVnaXN0ZXIoJ25ld0xldmVsJywgc3RhdGVzLm5ld0xldmVsLCBnZXRJZCgpKTtcbiAgICBldmVudHMucmVnaXN0ZXIoJ3N0YXJ0Jywgc3RhdGVzLmVkaXRpbmdMZXZlbCwgZ2V0SWQoKSk7XG5cbiAgICBldmVudHMucmVnaXN0ZXIoJ3BhdXNlJywgc3RhdGVzLnBhdXNlZExldmVsLCBnZXRJZCgpKTtcblxuICAgIGV2ZW50cy5yZWdpc3RlcignbWFpbk1lbnUnLCBzdGF0ZXMubWFpbk1lbnUsIGdldElkKCkpO1xuICAgIHN0YXRlcy5tYWluTWVudSgpO1xuXG59KTtcblxuXG5cblxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZhZGVJbjogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIG9iai5zdHlsZS5vcGFjaXR5ID0gMTtcbiAgICAgICAgb2JqLnN0eWxlLnpJbmRleCA9IDM7XG4gICAgICAgIG9iai5zdHlsZS5kaXNwbGF5ID0gJ2luaGVyaXQnO1xuICAgIH0sXG4gICAgZmFkZU91dDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIG9iai5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgb2JqLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICAgIG9iai5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn07XG4iLCJ2YXIgZXZlbnRzID0ge307XG5cbnZhciBhcGkgPSB7XG4gICAgZW1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBmb3IgKHZhciBpZCBpbiBldmVudHMpIHtcbiAgICAgICAgICAgIGlmIChldmVudHNbaWRdLmUgPT09IGUpIGV2ZW50c1tpZF0uZigpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWdpc3RlcjogZnVuY3Rpb24oZSwgZiwgaWQpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygncmVnaXN0ZXJpbmcgZXZlbnQgJyArIGUsIGYsIGlkKTtcbiAgICAgICAgZXZlbnRzW2lkXSA9IHtcbiAgICAgICAgICAgIGY6IGYsXG4gICAgICAgICAgICBlOiBlXG4gICAgICAgIH07XG4gICAgfSxcbiAgICB1bnJlZ2lzdGVyOiBmdW5jdGlvbihpZCkge1xuICAgICAgICBkZWxldGUgZXZlbnRzW2lkXTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcblxudmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgICBhcGkuZW1pdCgnYW5pbWF0ZScpO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG59O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSBhbmltYXRlKCk7XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIHZhciBodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICBodHRwLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICAvL1NlbmQgdGhlIHByb3BlciBoZWFkZXIgaW5mb3JtYXRpb24gYWxvbmcgd2l0aCB0aGUgcmVxdWVzdFxuICAgIGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuXG4gICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIGlmKChodHRwLnJlYWR5U3RhdGUgPT09IDQpICYmIGh0dHAuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGlmICgvXltcXF0sOnt9XFxzXSokLy50ZXN0KGh0dHAucmVzcG9uc2VUZXh0LnJlcGxhY2UoL1xcXFxbXCJcXFxcXFwvYmZucnR1XS9nLCAnQCcpLnJlcGxhY2UoL1wiW15cIlxcXFxcXG5cXHJdKlwifHRydWV8ZmFsc2V8bnVsbHwtP1xcZCsoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPy9nLCAnXScpLnJlcGxhY2UoLyg/Ol58OnwsKSg/OlxccypcXFspKy9nLCAnJykpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoaHR0cC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gaHR0cC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKVxuICAgICAgICB9XG4gICAgfTtcbiAgICBodHRwLnNlbmQoKTtcblxufTtcblxuIiwidmFyIEVudGl0aWVzID0ge307XG5cbkVudGl0aWVzWydwbGF5ZXInXSA9IHJlcXVpcmUoJy4vUGxheWVyLmpzJyk7XG5FbnRpdGllc1sndGVzdCddID0gcmVxdWlyZSgnLi90ZXN0LW9iai5qcycpO1xuRW50aXRpZXNbJ2d1biddID0gcmVxdWlyZSgnLi9ndW4uanMnKTtcbkVudGl0aWVzWyd0aWxlJ10gPSByZXF1aXJlKCcuL3NxdWFyZS5qcycpO1xuRW50aXRpZXNbJ3pvbWJpZVNwYXduZXInXSA9IHJlcXVpcmUoJy4vc3Bhd25lci5qcycpO1xuRW50aXRpZXNbJ3pvbWJpZSddID0gcmVxdWlyZSgnLi9ab21iaWUuanMnKTtcbkVudGl0aWVzWyd3YWxsJ10gPSByZXF1aXJlKCcuL3dhbGwuanMnKTtcbkVudGl0aWVzWydkb29yJ10gPSByZXF1aXJlKCcuL2Rvb3IuanMnKTtcbkVudGl0aWVzWydhcmVhJ10gPSByZXF1aXJlKCcuL2FyZWEuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdGllcztcbiIsInZhciBsYXN0SWQgPSAwO1xuXG52YXIgYXBpID0ge1xuICAgIGdldElkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdhJyArIGxhc3RJZCsrO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwidmFyIHdlYXBvbiA9IHJlcXVpcmUoJy4vd2VhcG9uLmpzJyk7XG4vL3ZhciB3b3JsZCA9IHJlcXVpcmUoJy4vd29ybGQuanMnKTtcbnZhciBCdWxsZXQgPSByZXF1aXJlKCcuL2J1bGxldC5qcycpO1xudmFyIG1ha2VJbnZlbnRvcnkgPSByZXF1aXJlKCcuL21ha2VJbnZlbnRvcnkuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGd1biA9IHdlYXBvbigpO1xuICAgIHZhciBidWxsZXQ7XG4gICAgaWYgKG9wdGlvbnMucG9zKSBndW4ubW92ZShvcHRpb25zLnBvcyk7XG4gICAgZ3VuLnVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnVsbGV0ID0gZ3VuLmdldEludmVudG9yeSgpWzBdO1xuICAgICAgICBpZiAoIWJ1bGxldCkge1xuICAgICAgICAgICAgYnVsbGV0ID0gQnVsbGV0KHt2ZWxvY2l0eTogMTAsIHBvd2VyOiAxMCwgcmFuZ2U6IDUwMH0pO1xuICAgICAgICAgICAgZ3VuLnRha2VJdGVtcyhidWxsZXQpO1xuICAgICAgICAgICAgd29ybGQubG9hZEl0ZW1zKGJ1bGxldCk7XG4gICAgICAgIH1cbiAgICAgICAgZ3VuLmRyb3BJdGVtKGJ1bGxldCk7XG4gICAgICAgIGJ1bGxldC5maXJlKGd1bi5vd25lci5wb3MpO1xuICAgIH07XG5cbiAgICBndW4udHlwZSA9ICdndW4nO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLnN0YXJ0QW1tbzsgaSsrKSB7XG4gICAgfVxuXG4gICAgcmV0dXJuIGd1bjtcbn07XG5cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbntcImVudGl0eVwiOiBcInRpbGVcIixcbiAgICBcInBvc1wiOiB7XG4gICAgICAgIFwieFwiOjk5MzAsXG4gICAgICAgIFwieVwiOjEwMTU2LFxuICAgICAgICBcInJvdFwiOjAuNzhcbiAgICB9LFxuICAgIFwid2lkdGhcIjpcIjUwMDBcIixcbiAgICBcImhlaWdodFwiOlwiNTAwMFwifSxcbntcImVudGl0eVwiOlwicGxheWVyXCIsXG4gICAgXCJwb3NcIjoge1wieFwiOjEwMDIzLjAyODg2ODk5NjA4NSxcInlcIjo5OTgwLjc3MzE2NDc3NTIxMyxcInJvdFwiOjB9LFwicmFkaXVzXCI6NTB9LFxue1wiZW50aXR5XCI6XCJndW5cIixcbiAgICBcInBvc1wiOiB7XCJ4XCI6MTAwMjMuMDI4ODY4OTk2MDg1LFwieVwiOjk5ODAuNzczMTY0Nzc1MjEzLFwicm90XCI6MH19LFxue1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTA0NDgsXCJ5XCI6MTA3NzMsXCJyb3RcIjowLjc4fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjo5NTk5LFwieVwiOjk3OTksXCJyb3RcIjowLjc4fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiMTIwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjo4MTMzLFwieVwiOjg0NDUsXCJyb3RcIjowLjc4fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiNTAwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDY4MSxcInlcIjo5Nzc3LFwicm90XCI6Mi4zNH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjEyMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTA5MjQsXCJ5XCI6ODUxNCxcInJvdFwiOjEuNTh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI4MDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTAwMDMsXCJ5XCI6ODYwOCxcInJvdFwiOjMuMTR9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCIxNjAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExNjQyLFwieVwiOjg0MTMsXCJyb3RcIjoyLjM0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiNTAwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMTY5NSxcInlcIjoxMTg3NyxcInJvdFwiOjAuNzh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI1MDAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjgxODMsXCJ5XCI6MTE5MjEsXCJyb3RcIjoyLjM0fSxcIndpZHRoXCI6XCIxMDBcIixcImhlaWdodFwiOlwiNTAwMFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMDI2NyxcInlcIjo4NzkwLFwicm90XCI6My4xNH0sXCJ3aWR0aFwiOlwiMTAwXCIsXCJoZWlnaHRcIjpcIjEyMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTAzNTEsXCJ5XCI6Nzg2MSxcInJvdFwiOjEuNTh9LFwid2lkdGhcIjpcIjEwMFwiLFwiaGVpZ2h0XCI6XCI4MDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6MTEwMjQsXCJ5XCI6OTA1NSxcInJvdFwiOjAuM30sXCJ3aWR0aFwiOlwiNDAwXCIsXCJoZWlnaHRcIjpcIjI1MFwifSx7XCJlbnRpdHlcIjpcIndhbGxcIixcInBvc1wiOntcInhcIjoxMTg5OCxcInlcIjo5NDkwLFwicm90XCI6MC42fSxcIndpZHRoXCI6XCI5MDBcIixcImhlaWdodFwiOlwiMTAwXCJ9LHtcImVudGl0eVwiOlwid2FsbFwiLFwicG9zXCI6e1wieFwiOjExNjE5LFwieVwiOjk4OTUsXCJyb3RcIjowLjZ9LFwid2lkdGhcIjpcIjkwMFwiLFwiaGVpZ2h0XCI6XCIxMDBcIn0se1wiZW50aXR5XCI6XCJ3YWxsXCIsXCJwb3NcIjp7XCJ4XCI6OTUwMCxcInlcIjoxMTc4NixcInJvdFwiOjB9LFwid2lkdGhcIjpcIjgwMFwiLFwiaGVpZ2h0XCI6XCI4MDBcIn0sXG57XCJlbnRpdHlcIjpcInpvbWJpZVNwYXduZXJcIixcInBvc1wiOntcInhcIjo3NzY5LFwieVwiOjk0MTEsXCJyb3RcIjowfSxcInJhZGl1c1wiOjEwLCBcInN0YXJ0XCI6IHRydWUsIFwiaW50ZXJ2YWxcIjogMjAwMDAsIFwic3Bhd25Db3VudFwiOiAxNX0sXG57XCJlbnRpdHlcIjpcInpvbWJpZVNwYXduZXJcIixcInBvc1wiOntcInhcIjoxMjM3OSxcInlcIjo5NDQ5LFwicm90XCI6MH0sXCJyYWRpdXNcIjoxMCwgXCJzdGFydFwiOiBmYWxzZSwgXCJpbnRlcnZhbFwiOiA0NTAwMCwgXCJzcGF3bkNvdW50XCI6IDM1fSxcbntcImVudGl0eVwiOlwiem9tYmllU3Bhd25lclwiLFwicG9zXCI6e1wieFwiOjg3NjAsXCJ5XCI6MTE5ODMsXCJyb3RcIjowfSxcInJhZGl1c1wiOjEwLCBcInN0YXJ0XCI6IHRydWUsIFwiaW50ZXJ2YWxcIjogMjAwMDAsIFwic3Bhd25Db3VudFwiOiA1fVxuXG5dO1xuXG5cbiIsInZhciBwZXJwUG9pbnQgPSBmdW5jdGlvbih2ZXJ0cywgcCkge1xuICAgIHZhciBvdXRwdXQgPSB2ZXJ0cy5tYXAoZnVuY3Rpb24odjAsIGluZGV4LCBhcnJheSkge1xuICAgICAgICB2YXIgdjEgPSBhcnJheVtpbmRleCArIDFdO1xuICAgICAgICBpZiAoaW5kZXggKyAxID09PSBhcnJheS5sZW5ndGgpIHYxID0gYXJyYXlbMF07XG4gICAgICAgIHZhciBrID0gKCh2MS55IC0gdjAueSkgKiAocC54IC0gdjAueCkgLSAodjEueCAtIHYwLngpICogKHAueSAtIHYwLnkpKSAvIChNYXRoLnBvdyh2MS55IC0gdjAueSwgMikgKyBNYXRoLnBvdyh2MS54IC0gdjAueCwgMikpO1xuICAgICAgICB2YXIgcGVycFBvaW50ID0ge3g6IHAueCAtIGsgKiAodjEueSAtIHYwLnkpLCB5OiBwLnkgKyBrICogKHYxLnggLSB2MC54KX07XG4gICAgICAgIHZhciBkaXMgPSBNYXRoLnNxcnQoTWF0aC5wb3cocC54IC0gcGVycFBvaW50LngsIDIpICsgTWF0aC5wb3cocC55IC0gcGVycFBvaW50LnksIDIpKTtcbiAgICAgICAgcmV0dXJuIHtkaXM6IGRpcywgcGVycFBvaW50OiBwZXJwUG9pbnR9O1xuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHBhc3QsIGN1cnJlbnQpIHsgXG4gICAgICAgIGlmICghcGFzdC5kaXMpIHJldHVybiBjdXJyZW50O1xuICAgICAgICBpZiAoY3VycmVudC5kaXMgPCBwYXN0LmRpcykgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICAgIHJldHVybiBwYXN0O1xuICAgIH0pLnBlcnBQb2ludDtcbn07XG5cblxudmFyIHBvaW50SW5Qb2x5Z29uID0gZnVuY3Rpb24oc3F1YXJlLCBjaXJjbGUpIHtcbiAgICB2YXIgYyA9IGZhbHNlO1xuICAgIHZhciBpLCBqLCB4LCB5LCBwO1xuICAgIHZhciB2ZXJ0aWNlcyA9IHNxdWFyZS52ZXJ0cztcbiAgICB2YXIgcG9pbnQgPSBjaXJjbGUucG9zO1xuXG4gICAgaiA9IHZlcnRpY2VzLmxlbmd0aCAtIDE7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICBpZiAoICgodmVydGljZXNbaV0ueSA+IHBvaW50LnkpICE9PSAodmVydGljZXNbal0ueSA+IHBvaW50LnkpKSAmJlxuICAgICAgICAocG9pbnQueCA8ICh2ZXJ0aWNlc1tqXS54IC0gdmVydGljZXNbaV0ueCkgKiAocG9pbnQueSAtIHZlcnRpY2VzW2ldLnkpIC8gKHZlcnRpY2VzW2pdLnkgLSB2ZXJ0aWNlc1tpXS55KSArIHZlcnRpY2VzW2ldLngpICkge1xuICAgICAgICAgICAgYyA9ICFjO1xuICAgICAgICB9XG5cbiAgICAgICAgaiA9IGk7XG4gICAgfVxuXG4gICAgaWYgKGMpIHtcbiAgICAgICAgaWYgKHNxdWFyZS5zb2xpZCAmJiBjaXJjbGUuc29saWQpIHtcbiAgICAgICAgICAgIHAgPSBwZXJwUG9pbnQodmVydGljZXMsIHBvaW50KTtcbiAgICAgICAgICAgIC8veCA9IHAueCAtIGNpcmNsZS5wb3MueDtcbiAgICAgICAgICAgIC8veSAuPSBwLnkgLSBjaXJjbGUucG9zLnk7XG4gICAgICAgICAgICAvL2NpcmNsZS5hZGRFZmZlY3QoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgICAgIGNpcmNsZS5tb3ZlKHt4OiBwLngsIHk6IHAueX0pOyBcbiAgICAgICAgICAgIC8vfSk7XG4gICAgICAgICAgICBjaXJjbGUuY29sbGlkZShzcXVhcmUpO1xuICAgICAgICAgICAgc3F1YXJlLmNvbGxpZGUoY2lyY2xlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59O1xuXG52YXIgbG9uZ1B1c2ggPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHRoZW4gPSBEYXRlLm5vdygpO1xuICAgIHZhciB4ID0gTWF0aC5jb3MoYi5wb3Mucm90KSAqIGIudmVsb2NpdHk7XG4gICAgdmFyIHkgPSBNYXRoLnNpbihiLnBvcy5yb3QpICogYi52ZWxvY2l0eTtcbiAgICBhLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsYXBzZWRUaW1lID0gKERhdGUubm93KCkgLSB0aGVuKSAvIDEwMDA7XG4gICAgICAgIHZhciBzY2FsZXIgPSBNYXRoLnBvdyhlbGFwc2VkVGltZSAtIDEsIDIpO1xuICAgICAgICBpZiAoZWxhcHNlZFRpbWUgPiAxKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGEucHVzaCh7eDogeCAqIHNjYWxlciwgeTogeSAqIHNjYWxlcn0pO1xuXG4gICAgfSk7XG59O1xuXG52YXIgY2lyY2xlRGV0ZWN0ID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4LCB5LCBkaXMsIHJhZGl1cywgZGVsdGEsIHRoZXRhLCBhRGVsdGEsIGJEZWx0YTtcbiAgICB4ID0gYS5wb3MueCAtIGIucG9zLng7XG4gICAgeSA9IGEucG9zLnkgLSBiLnBvcy55O1xuICAgIGRpcyA9IE1hdGguc3FydChNYXRoLnBvdyh4LCAyKSArIE1hdGgucG93KHksIDIpKTtcbiAgICByYWRpdXMgPSBwYXJzZUludChhLnJhZGl1cykgKyBwYXJzZUludChiLnJhZGl1cyk7XG5cbiAgICBpZiAoZGlzIDwgcmFkaXVzKSB7XG4gICAgICAgIGlmIChhLnNvbGlkICYmIGIuc29saWQpIHtcbiAgICAgICAgICAgIGRlbHRhID0gKHJhZGl1cyAtIGRpcyk7XG4gICAgICAgICAgICB0aGV0YSA9IE1hdGguYXRhbjIoeSwgeCk7XG4gICAgICAgICAgICBhLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgYS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogKE1hdGguY29zKHRoZXRhKSAqIGRlbHRhKSwgXG4gICAgICAgICAgICAgICAgICAgIHk6IChNYXRoLnNpbih0aGV0YSkgKiBkZWx0YSlcbiAgICAgICAgICAgICAgICB9KTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBiLmFkZEVmZmVjdChmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgYi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogKE1hdGguY29zKHRoZXRhKSAqIC1kZWx0YSksICBcbiAgICAgICAgICAgICAgICAgICAgeTogKE1hdGguc2luKHRoZXRhKSAqIC1kZWx0YSlcbiAgICAgICAgICAgICAgICB9KTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYi5pbmVydGlhKSBsb25nUHVzaChhLCBiKTtcbiAgICAgICAgICAgIGlmIChhLmluZXJ0aWEpIGxvbmdQdXNoKGIsIGEpO1xuICAgICAgICAgICAgYS5jb2xsaWRlKGIpO1xuICAgICAgICAgICAgYi5jb2xsaWRlKGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn07XG5cbnZhciBzZXRBQUJCID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIEFBQkIgPSB7XG4gICAgICAgIHhzOiBbe3R5cGU6ICdiJywgdmFsOiBJbmZpbml0eSwgb2JqOiBvYmp9LCB7dHlwZTogJ2UnLCB2YWw6IC1JbmZpbml0eSwgb2JqOiBvYmp9XSxcbiAgICAgICAgeXM6IFt7dHlwZTogJ2InLCB2YWw6IEluZmluaXR5LCBvYmo6IG9ian0sIHt0eXBlOiAnZScsIHZhbDogLUluZmluaXR5LCBvYmo6IG9ian1dXG4gICAgfTtcblxuICAgIGlmIChvYmouZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSB7XG4gICAgICAgIEFBQkIueHNbMF0udmFsID0gb2JqLnBvcy54IC0gb2JqLnJhZGl1cztcbiAgICAgICAgQUFCQi54c1sxXS52YWwgPSBvYmoucG9zLnggKyBvYmoucmFkaXVzO1xuICAgICAgICBBQUJCLnlzWzBdLnZhbCA9IG9iai5wb3MueSAtIG9iai5yYWRpdXM7XG4gICAgICAgIEFBQkIueXNbMV0udmFsID0gb2JqLnBvcy55ICsgb2JqLnJhZGl1cztcbiAgICAgICAgb2JqLkFBQkIgPSBBQUJCO1xuICAgICAgICByZXR1cm47XG4gICAgfTtcbiAgICBpZiAob2JqLmdlb21ldHJ5ID09PSAnc3F1YXJlJykge1xuICAgICAgICBvYmouQUFCQiA9IG9iai52ZXJ0cy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCB2ZXJ0KSB7XG4gICAgICAgICAgICBpZiAodmVydC54IDwgYWNjLnhzWzBdLnZhbCkgYWNjLnhzWzBdLnZhbCA9IHZlcnQueDtcbiAgICAgICAgICAgIGlmICh2ZXJ0LnggPiBhY2MueHNbMV0udmFsKSBhY2MueHNbMV0udmFsID0gdmVydC54O1xuICAgICAgICAgICAgaWYgKHZlcnQueSA8IGFjYy55c1swXS52YWwpIGFjYy55c1swXS52YWwgPSB2ZXJ0Lnk7XG4gICAgICAgICAgICBpZiAodmVydC55ID4gYWNjLnlzWzFdLnZhbCkgYWNjLnlzWzFdLnZhbCA9IHZlcnQueTtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIEFBQkIpO1xuICAgIH1cbn07XG5cbnZhciBzZXRWZXJ0cyA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgb2JqLnBvcy54ID0gcGFyc2VJbnQob2JqLnBvcy54KTtcbiAgICBvYmoucG9zLnkgPSBwYXJzZUludChvYmoucG9zLnkpO1xuXG4gICAgdmFyIHZlcnRzID0gW1xuICAgICAgICB7eDogb2JqLnBvcy54IC0gb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55IC0gb2JqLmhlaWdodCAvIDJ9LCBcbiAgICAgICAge3g6IG9iai5wb3MueCArIG9iai53aWR0aCAvIDIsIHk6IG9iai5wb3MueSAtIG9iai5oZWlnaHQgLyAyfSwgXG4gICAgICAgIHt4OiBvYmoucG9zLnggKyBvYmoud2lkdGggLyAyLCB5OiBvYmoucG9zLnkgKyBvYmouaGVpZ2h0IC8gMn0sIFxuICAgICAgICB7eDogb2JqLnBvcy54IC0gb2JqLndpZHRoIC8gMiwgeTogb2JqLnBvcy55ICsgb2JqLmhlaWdodCAvIDJ9LCBcbiAgICBdO1xuXG4gICAgdmFyIHJvdCA9IG9iai5wb3Mucm90O1xuICAgIHZhciBveCA9IG9iai5wb3MueDtcbiAgICB2YXIgb3kgPSBvYmoucG9zLnk7XG5cbiAgICBvYmoudmVydHMgPSB2ZXJ0cy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgdnggPSBpdGVtLng7XG4gICAgICAgIHZhciB2eSA9IGl0ZW0ueTtcbiAgICAgICAgaXRlbS54ID0gTWF0aC5jb3Mocm90KSAqICh2eCAtIG94KSAtIE1hdGguc2luKHJvdCkgKiAodnkgLSBveSkgKyBveDtcbiAgICAgICAgaXRlbS55ID0gTWF0aC5zaW4ocm90KSAqICh2eCAtIG94KSArIE1hdGguY29zKHJvdCkgKiAodnkgLSBveSkgKyBveTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG5cbiAgICBzZXRBQUJCKG9iaik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgdHlwZSkge1xuICAgIG9iai5nZW9tZXRyeSA9IHR5cGU7XG4gICAgaWYgKHR5cGUgPT09ICdjaXJjbGUnKSB7XG4gICAgICAgIG9iai5kZXRlY3RDb2xsaWRlID0gZnVuY3Rpb24oY29sbGlkZXIpIHtcbiAgICAgICAgICAgIGlmIChjb2xsaWRlci5nZW9tZXRyeSA9PT0gJ2NpcmNsZScpIHJldHVybiBjaXJjbGVEZXRlY3Qob2JqLCBjb2xsaWRlcik7XG4gICAgICAgICAgICBpZiAoY29sbGlkZXIuZ2VvbWV0cnkgPT09ICdzcXVhcmUnKSByZXR1cm4gcG9pbnRJblBvbHlnb24oY29sbGlkZXIsIG9iaik7XG4gICAgICAgIH07XG4gICAgICAgIG9iai5tb3ZlKHtldjogc2V0QUFCQi5iaW5kKG51bGwsIG9iail9KTtcbiAgICAgICAgc2V0QUFCQihvYmopO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ3NxdWFyZScpIHtcbiAgICAgICAgb2JqLmRldGVjdENvbGxpZGUgPSBmdW5jdGlvbihjb2xsaWRlcikge1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnc3F1YXJlJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNvbGxpZGVyLmdlb21ldHJ5ID09PSAnY2lyY2xlJykgcmV0dXJuIHBvaW50SW5Qb2x5Z29uKG9iaiwgY29sbGlkZXIpO1xuICAgICAgICB9O1xuICAgICAgICBvYmoud2lkdGggPSAxMDA7XG4gICAgICAgIG9iai5oZWlnaHQgPSAxMDA7XG4gICAgICAgIG9iai5zZXREaW1lbnNpb25zID0gZnVuY3Rpb24oZGltKSB7XG4gICAgICAgICAgICBpZiAoZGltKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpbS53aWR0aCkgb2JqLndpZHRoID0gZGltLndpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChkaW0uaGVpZ2h0KSBvYmouaGVpZ2h0ID0gZGltLmhlaWdodDtcbiAgICAgICAgICAgICAgICBzZXRWZXJ0cyhvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9iai5tb3ZlKHtldjogc2V0VmVydHMuYmluZChudWxsLCBvYmopfSk7XG4gICAgICAgIHNldFZlcnRzKG9iaik7XG4gICAgfVxufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBvYmouZ2V0SW5pdGlhbENvbmRpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluaXRpYWxDb25kaXRpb25zID0ge1xuICAgICAgICAgICAgZW50aXR5OiBvYmoudHlwZSxcbiAgICAgICAgICAgIHBvczoge1xuICAgICAgICAgICAgICAgIHg6IG9iai5wb3MueCxcbiAgICAgICAgICAgICAgICB5OiBvYmoucG9zLnksXG4gICAgICAgICAgICAgICAgcm90OiBvYmoucG9zLnJvdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG9iai5nZW9tZXRyeSAmJiBvYmouZ2VvbWV0cnkgPT09ICdjaXJjbGUnKSB7XG4gICAgICAgICAgICBpbml0aWFsQ29uZGl0aW9ucy5yYWRpdXMgPSBvYmoucmFkaXVzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouZ2VvbWV0cnkgJiYgb2JqLmdlb21ldHJ5ID09PSAnc3F1YXJlJykge1xuICAgICAgICAgICAgaW5pdGlhbENvbmRpdGlvbnMud2lkdGggPSBvYmoud2lkdGg7XG4gICAgICAgICAgICBpbml0aWFsQ29uZGl0aW9ucy5oZWlnaHQgPSBvYmouaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmoudHlwZSA9PT0gJ2Rvb3InKSB7XG4gICAgICAgICAgICBpbml0aWFsQ29uZGl0aW9ucy5vcGVuUG9zID0gb2JqLm9wZW5Qb3M7XG4gICAgICAgICAgICBpbml0aWFsQ29uZGl0aW9ucy5jbG9zZVBvcyA9IG9iai5jbG9zZVBvcztcbiAgICAgICAgICAgIGluaXRpYWxDb25kaXRpb25zLm9wZW5lZCA9IG9iai5vcGVuZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0YXJ0T3B0aW9ucztcbiAgICAgICAgaWYgKG9iai5zdGFydE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHN0YXJ0T3B0aW9ucyA9IG9iai5zdGFydE9wdGlvbnMoKTtcbiAgICAgICAgICAgIGZvciAodmFyIG9wdGlvbiBpbiBzdGFydE9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpbml0aWFsQ29uZGl0aW9uc1tvcHRpb25dID0gc3RhcnRPcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluaXRpYWxDb25kaXRpb25zO1xuICAgIH07XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuXG4gICAgdmFyIGludmVudG9yeSA9IFtdO1xuICAgIG9iai50YWtlSXRlbXMgPSBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICBpZiAoIWl0ZW1zLmxlbmd0aCkgaXRlbXMgPSBbaXRlbXNdO1xuICAgICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50T2JqID0gb2JqLmdldEludmVudG9yeUJ5VHlwZShpdGVtLnR5cGUpWzBdO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRPYmogJiYgY3VycmVudE9iai5jb25zb2xpZGF0ZUludmVudG9yeSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmoudGFrZUl0ZW1zKGl0ZW0uZ2V0SW52ZW50b3J5KCkpO1xuICAgICAgICAgICAgICAgIGl0ZW0udW5sb2FkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGludmVudG9yeS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGl0ZW0ub3duZXIgPSBvYmo7XG4gICAgICAgICAgICAgICAgaXRlbS5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgb2JqLmRyb3BJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpdGVtLm93bmVyID0gZmFsc2U7XG4gICAgICAgIGludmVudG9yeSA9IGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24obWF5YmVJdGVtKSB7IGlmIChtYXliZUl0ZW0uaWQgIT09IGl0ZW0uaWQpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xuICAgIG9iai5nZXRJbnZlbnRvcnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5zbGljZSgpO1xuICAgIH07XG4gICAgb2JqLmdldEludmVudG9yeUJ5VHlwZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGludmVudG9yeS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkgeyBpZiAoaXRlbS50eXBlID09PSB0eXBlKSByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgfTtcbiAgICBvYmouZ2V0SW52ZW50b3J5QnlCYXNlID0gZnVuY3Rpb24oYmFzZSkge1xuICAgICAgICByZXR1cm4gaW52ZW50b3J5LmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IGlmIChpdGVtLmJhc2UgPT09IGJhc2UpIHJldHVybiB0cnVlOyB9KTtcbiAgICB9O1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIG9iai5zb2xpZCA9IHRydWU7XG59O1xuIiwiXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHN0YXJ0T3B0aW9ucyA9IHt9O1xuICAgIG9iai5zdGFydE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucykgcmV0dXJuIHN0YXJ0T3B0aW9ucztcbiAgICAgICAgZm9yICh2YXIgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHN0YXJ0T3B0aW9uc1tvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4iLCJ2YXIgdGV4dHVyZURhdGEgPSByZXF1aXJlKCcuL3RleHR1cmVEYXRhLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZVZpc2libGUgKG9iaikge1xuICAgIG9iai5sb2FkKGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgb2JqLnRleHR1cmVEYXRhID0gdGV4dHVyZURhdGFbb2JqLmJhc2VdW29iai50eXBlXTsgXG4gICAgICAgIG9iai52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgb2JqLmFkZEVmZmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChvYmouaW5Db250YWluZXIoKSkge1xuICAgICAgICAgICAgICAgIG9iai52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iai52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG4iLCJmdW5jdGlvbiBNYXRyaXhTdGFjaygpIHtcbiAgICAgIHRoaXMuc3RhY2sgPSBbXTtcblxuICAgICAgLy9zaW5jZSB0aGUgc3RhY2sgaXMgZW1wdHkgdGhpcyB3aWxsIHB1dCBhbiBpbml0aWFsIG1hdHJpeCBpbiBpdFxuICAgICAgICAgIHRoaXMucmVzdG9yZSgpO1xufVxuXG4vLyBQb3BzIHRoZSB0b3Agb2YgdGhlIHN0YWNrIHJlc3RvcmluZyB0aGUgcHJldmlvdXNseSBzYXZlZCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5yZXN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGFjay5wb3AoKTtcbiAgICAvLyBOZXZlciBsZXQgdGhlIHN0YWNrIGJlIHRvdGFsbHkgZW1wdHlcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPCAxKSB7XG4gICAgICAgIHRoaXMuc3RhY2tbMF0gPSBtNC5pZGVudGl0eSgpO1xuICAgIH1cbn07XG5cbi8vIFB1c2hlcyBhIGNvcHkgb2YgdGhlIGN1cnJlbnQgbWF0cml4IG9uIHRoZSBzdGFja1xuTWF0cml4U3RhY2sucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YWNrLnB1c2godGhpcy5nZXRDdXJyZW50TWF0cml4KCkpO1xufTtcblxuLy8gR2V0cyBhIGNvcHkgb2YgdGhlIGN1cnJlbnQgbWF0cml4ICh0b3Agb2YgdGhlIHN0YWNrKVxuTWF0cml4U3RhY2sucHJvdG90eXBlLmdldEN1cnJlbnRNYXRyaXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLnNsaWNlKCk7XG59O1xuXG4vLyBMZXRzIHVzIHNldCB0aGUgY3VycmVudCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS5zZXRDdXJyZW50TWF0cml4ID0gZnVuY3Rpb24obSkge1xuICAgIHJldHVybiB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0gPSBtO1xufTtcblxuLy8gVHJhbnNsYXRlcyB0aGUgY3VycmVudCBtYXRyaXhcbk1hdHJpeFN0YWNrLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgaWYgKHogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB6ID0gMDtcbiAgICB9XG4gICAgdmFyIG0gPSB0aGlzLmdldEN1cnJlbnRNYXRyaXgoKTtcbiAgICB0aGlzLnNldEN1cnJlbnRNYXRyaXgobTQudHJhbnNsYXRlKG0sIHgsIHksIHopKTtcbn07XG5cbi8vIFJvdGF0ZXMgdGhlIGN1cnJlbnQgbWF0cml4IGFyb3VuZCBaXG5NYXRyaXhTdGFjay5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uKGFuZ2xlSW5SYWRpYW5zKSB7XG4gICAgdmFyIG0gPSB0aGlzLmdldEN1cnJlbnRNYXRyaXgoKTtcbiAgICB0aGlzLnNldEN1cnJlbnRNYXRyaXgobTQuelJvdGF0ZShtLCBhbmdsZUluUmFkaWFucykpO1xufTtcblxuLy8gU2NhbGVzIHRoZSBjdXJyZW50IG1hdHJpeFxuTWF0cml4U3RhY2sucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIGlmICh6ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeiA9IDE7XG4gICAgfVxuICAgIHZhciBtID0gdGhpcy5nZXRDdXJyZW50TWF0cml4KCk7XG4gICAgdGhpcy5zZXRDdXJyZW50TWF0cml4KG00LnNjYWxlKG0sIHgsIHksIHopKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXhTdGFjaztcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgcGFyYW1zID0gJyc7XG4gICAgZm9yICh2YXIgcGFyYW0gaW4gZGF0YSkge1xuICAgICAgICBwYXJhbXMgKz0gKChwYXJhbXMubGVuZ3RoKSA/ICcmJyA6ICcnKSArIHBhcmFtICsgJz0nICsgZGF0YVtwYXJhbV07XG4gICAgfVxuICAgIGh0dHAub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICAvL1NlbmQgdGhlIHByb3BlciBoZWFkZXIgaW5mb3JtYXRpb24gYWxvbmcgd2l0aCB0aGUgcmVxdWVzdFxuICAgIGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuXG4gICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHsvL0NhbGwgYSBmdW5jdGlvbiB3aGVuIHRoZSBzdGF0ZSBjaGFuZ2VzLlxuICAgICAgICB2YXIgZGF0YTtcbiAgICAgICAgaWYoaHR0cC5yZWFkeVN0YXRlID09PSA0ICYmIGh0dHAuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBodHRwLnNlbmQocGFyYW1zKTtcblxufTtcblxuIiwidmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9qZWN0aWxlID0gYmFzZUVudGl0eSgpO1xuICAgIG1ha2VWaXNpYmxlKHByb2plY3RpbGUpO1xuICAgIG1ha2VHZW9tZXRyeShwcm9qZWN0aWxlLCAnY2lyY2xlJyk7XG4gICAgcHJvamVjdGlsZS5iYXNlID0gJ3Byb2plY3RpbGUnO1xuXG4gICAgcmV0dXJuIHByb2plY3RpbGU7XG59O1xuXG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgZ2wgPSByZXF1aXJlKCcuL3dlYmdsLmpzJyk7XG52YXIgV29ybGQgPSByZXF1aXJlKCcuL3dvcmxkLmpzJyk7XG4vL3ZhciBhdWRpbyA9IHJlcXVpcmUoJy4vYXVkaW8uanMnKTtcbnZhciBjdXJyZW50TGV2ZWw7XG52YXIgcG92O1xudmFyIGNhbnZhc0RpbSA9IGdsLmNhbnZhc0RpbWVuc2lvbnM7XG5Xb3JsZC5jYW52YXNEaW0gPSBjYW52YXNEaW07XG5cblxudmFyIHN0ZXAgPSBmdW5jdGlvbigpIHtcblxuICAgIGdsLmNsZWFyKCk7XG4gICAgZ2wuc2V0VXBDYW1lcmEocG92KTtcbiAgICB2YXIgdGV4dHVyZSA9IGdsLmdldFRleHR1cmUoKTtcbiAgICB2YXIgaW5zdGFuY2VzID0gW107XG4gICAgdmFyIHRleHR1cmVzID0gW107XG4gICAgdmFyIGRpbXMgPSBbXTtcbiAgICBXb3JsZC5nZXRHZW9tZXRyeSgnc3F1YXJlJykuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpbmRleCwgYXJyYXkpIHtcbiAgICAgICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzLmNvbmNhdChbaXRlbS5wb3MueCwgaXRlbS5wb3MueSwgaXRlbS5wb3Mucm90XSk7XG4gICAgICAgIHRleHR1cmVzID0gdGV4dHVyZXMuY29uY2F0KFtcbiAgICAgICAgICAgICAgICBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnggLyAoKHRleHR1cmUpID8gdGV4dHVyZS53aWR0aCA6IDEpLCBcbiAgICAgICAgICAgICAgICBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnkgLyAoKHRleHR1cmUpID8gdGV4dHVyZS5oZWlnaHQgOiAxKSwgXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS53IC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUud2lkdGggOiAxKSwgXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS5oIC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUuaGVpZ2h0IDogMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGRpbXMgPSBkaW1zLmNvbmNhdChbaXRlbS53aWR0aCwgaXRlbS5oZWlnaHRdKTtcbiAgICB9KTtcbiAgICBnbC5kcmF3U3F1YXJlcyhpbnN0YW5jZXMsIGRpbXMsIHRleHR1cmVzKTtcbiAgICBpbnN0YW5jZXMgPSBbXTtcbiAgICB0ZXh0dXJlcyA9IFtdO1xuICAgIFdvcmxkLmdldEdlb21ldHJ5KCdjaXJjbGUnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0sIGluZGV4LCBhcnJheSkge1xuICAgICAgICBpbnN0YW5jZXMgPSBpbnN0YW5jZXMuY29uY2F0KFtpdGVtLnBvcy54LCBpdGVtLnBvcy55LCBpdGVtLnBvcy5yb3QsIGl0ZW0ucmFkaXVzXSk7XG4gICAgICAgIHRleHR1cmVzID0gdGV4dHVyZXMuY29uY2F0KFtcbiAgICAgICAgICAgICAgICAoaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS54ICsgKCgoaXRlbS5wb3NlKSA/IGl0ZW0ucG9zZS54IDogMCkgLyAoKGl0ZW0udGV4dHVyZURhdGEucG9zZXMpID8gaXRlbS50ZXh0dXJlRGF0YS5wb3Nlcy54IDogMSkpICogaXRlbS50ZXh0dXJlRGF0YS5mcmFtZS53KSAvICgodGV4dHVyZSkgPyB0ZXh0dXJlLndpZHRoIDogMSksIFxuICAgICAgICAgICAgICAgIChpdGVtLnRleHR1cmVEYXRhLmZyYW1lLnkgKyAoKChpdGVtLnBvc2UpID8gaXRlbS5wb3NlLnkgOiAwKSAvICgoaXRlbS50ZXh0dXJlRGF0YS5wb3NlcykgPyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLnkgOiAxKSkgKiBpdGVtLnRleHR1cmVEYXRhLmZyYW1lLmgpIC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUuaGVpZ2h0IDogMSksIFxuICAgICAgICAgICAgICAgIChpdGVtLnRleHR1cmVEYXRhLmZyYW1lLncgLyAoKGl0ZW0udGV4dHVyZURhdGEucG9zZXMpID8gaXRlbS50ZXh0dXJlRGF0YS5wb3Nlcy54IDogMSkpIC8gKCh0ZXh0dXJlKSA/IHRleHR1cmUud2lkdGggOiAxKSwgXG4gICAgICAgICAgICAgICAgKGl0ZW0udGV4dHVyZURhdGEuZnJhbWUuaCAvICgoaXRlbS50ZXh0dXJlRGF0YS5wb3NlcykgPyBpdGVtLnRleHR1cmVEYXRhLnBvc2VzLnkgOiAxKSkgLyAoKHRleHR1cmUpID8gdGV4dHVyZS5oZWlnaHQgOiAxKVxuICAgICAgICBdKTtcbiAgICB9KTtcbiAgICBnbC5kcmF3Q2lyY2xlcyhpbnN0YW5jZXMsIHRleHR1cmVzKTtcblxufTtcblxudmFyIGFwaSA9IHtcbiAgICBzdGVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHBvdiAmJiBnbC5pc0xvYWRlZCgpKSBzdGVwKCk7XG4gICAgfSxcbiAgICBjb25uZWN0Q2FtZXJhOiBmdW5jdGlvbihjYW1lcmEpIHtcbiAgICAgICAgcG92ID0gY2FtZXJhLnBvcztcbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwidmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciB6b21iaWUgPSByZXF1aXJlKCcuL1pvbWJpZS5qcycpO1xudmFyIG1ha2VTdGFydE9wdGlvbnMgPSByZXF1aXJlKCcuL21ha2VTdGFydE9wdGlvbnMuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xuLy92YXIgd29ybGQgPSByZXF1aXJlKCcuL3dvcmxkLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBzcGF3bmVyID0gYmFzZUVudGl0eSgpO1xuICAgIG1ha2VTdGFydE9wdGlvbnMoc3Bhd25lcik7XG4gICAgbWFrZUdlb21ldHJ5KHNwYXduZXIsICdjaXJjbGUnKTtcbiAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpO1xuICAgIHZhciBzcGF3bmluZyA9IG9wdGlvbnMuc3RhcnQ7XG4gICAgdmFyIHNwYXduQ291bnQgPSBvcHRpb25zLnNwYXduQ291bnQ7XG4gICAgdmFyIGxhc3RTcGF3biA9IERhdGUubm93KCk7XG4gICAgc3Bhd25lci5zdGFydE9wdGlvbnMoe1xuICAgICAgICBzdGFydDogb3B0aW9ucy5zdGFydCxcbiAgICAgICAgc3Bhd25Db3VudDogb3B0aW9ucy5zcGF3bkNvdW50LFxuICAgICAgICBpbnRlcnZhbDogb3B0aW9ucy5pbnRlcnZhbFxuICAgIH0pO1xuICAgIFxuICAgIHNwYXduZXIuYmFzZSA9ICdzcGF3bmVyJztcbiAgICBzcGF3bmVyLnR5cGUgPSAnem9tYmllU3Bhd25lcic7XG4gICAgc3Bhd25lci5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBzcGF3bmVyLnN0ZXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAoc3Bhd25pbmcpIHtcbiAgICAgICAgICAgIGlmIChzcGF3bkNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3Bhd25Db3VudCA9IG9wdGlvbnMuc3Bhd25Db3VudDtcbiAgICAgICAgICAgICAgICBzcGF3bmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRpbWVyID0gbm93O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdyAtIGxhc3RTcGF3biA+IDUwMCkge1xuICAgICAgICAgICAgICAgIGxhc3RTcGF3biA9IG5vdztcbiAgICAgICAgICAgICAgICB3b3JsZC5sb2FkSXRlbXMoem9tYmllKHtwb3M6IHNwYXduZXIucG9zfSkpO1xuICAgICAgICAgICAgICAgIHNwYXduQ291bnQtLTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vdyAtIHRpbWVyID4gb3B0aW9ucy5pbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIHNwYXduaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNwYXduZXI7XG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcImZyYW1lc1wiOntcImJ1bGxldFwiOntcImZyYW1lXCI6e1wieFwiOjQ1MyxcInlcIjo5MjIsXCJ3XCI6MjAxLFwiaFwiOjQ2fSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjIwMSxcImhcIjo0Nn0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjIwMSxcImhcIjo0Nn19LFwibWFjaGluZWd1blwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6OTIyLFwid1wiOjE1MCxcImhcIjoxNTB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MCxcImhcIjoxNTB9fSxcInBpc3RvbFwiOntcImZyYW1lXCI6e1wieFwiOjE1MSxcInlcIjo5MjIsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJyb3RhdGVkXCI6ZmFsc2UsXCJ0cmltbWVkXCI6ZmFsc2UsXCJzcHJpdGVTb3VyY2VTaXplXCI6e1wieFwiOjAsXCJ5XCI6MCxcIndcIjoxNTAsXCJoXCI6MTUwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwLFwiaFwiOjE1MH19LFwicGxheWVyXCI6e1wiZnJhbWVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6MjgwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6MjgwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjoyODB9fSxcInNob3RndW5cIjp7XCJmcmFtZVwiOntcInhcIjozMDIsXCJ5XCI6OTIyLFwid1wiOjE1MCxcImhcIjoxNTB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwLFwiaFwiOjE1MH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjE1MCxcImhcIjoxNTB9fSxcIndhbGxcIjp7XCJmcmFtZVwiOntcInhcIjo0NTMsXCJ5XCI6OTY5LFwid1wiOjEwMCxcImhcIjoxMDB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTAwLFwiaFwiOjEwMH0sXCJzb3VyY2VTaXplXCI6e1wid1wiOjEwMCxcImhcIjoxMDB9fSxcInpvbWJpZTFcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjE3NjAsXCJ3XCI6MTUwMCxcImhcIjo1NjB9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjo1NjB9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjU2MH19LFwiem9tYmllMlwiOntcImZyYW1lXCI6e1wieFwiOjAsXCJ5XCI6MjgxLFwid1wiOjE1MDAsXCJoXCI6NjQwfSxcInJvdGF0ZWRcIjpmYWxzZSxcInRyaW1tZWRcIjpmYWxzZSxcInNwcml0ZVNvdXJjZVNpemVcIjp7XCJ4XCI6MCxcInlcIjowLFwid1wiOjE1MDAsXCJoXCI6NjQwfSxcInNvdXJjZVNpemVcIjp7XCJ3XCI6MTUwMCxcImhcIjo2NDB9fSxcInpvbWJpZTNcIjp7XCJmcmFtZVwiOntcInhcIjowLFwieVwiOjE2MzQsXCJ3XCI6MTUwMCxcImhcIjo2ODZ9LFwicm90YXRlZFwiOmZhbHNlLFwidHJpbW1lZFwiOmZhbHNlLFwic3ByaXRlU291cmNlU2l6ZVwiOntcInhcIjowLFwieVwiOjAsXCJ3XCI6MTUwMCxcImhcIjo2ODZ9LFwic291cmNlU2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjY4Nn19fSxcIm1ldGFcIjp7XCJhcHBcIjpcImh0dHBzOi8vd3d3Lmxlc2h5bGFicy5jb20vYXBwcy9zc3Rvb2wvXCIsXCJ2ZXJzaW9uXCI6XCJMZXNoeSBTcHJpdGVTaGVldCBUb29sIHYwLjguNFwiLFwiaW1hZ2VcIjpcInNwcml0ZXNoZWV0LnBuZ1wiLFwic2l6ZVwiOntcIndcIjoxNTAwLFwiaFwiOjIzMjB9LFwic2NhbGVcIjoxfX07XG4iLCJ2YXIgYmFzZUVudGl0eSA9IHJlcXVpcmUoJy4vYmFzZUVudGl0eS5qcycpO1xudmFyIG1ha2VWaXNpYmxlID0gcmVxdWlyZSgnLi9tYWtlVmlzaWJsZS5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBzcXVhcmUgPSBiYXNlRW50aXR5KCk7XG4gICAgbWFrZUdlb21ldHJ5KHNxdWFyZSwgJ3NxdWFyZScpO1xuICAgIG1ha2VWaXNpYmxlKHNxdWFyZSk7XG4gICAgc3F1YXJlLnNldERpbWVuc2lvbnMoe3dpZHRoOiBvcHRpb25zLndpZHRoLCBoZWlnaHQ6IG9wdGlvbnMuaGVpZ2h0fSk7XG4gICAgc3F1YXJlLm1vdmUob3B0aW9ucy5wb3MpO1xuICAgIHNxdWFyZS5iYXNlID0gJ3NxdWFyZSc7XG4gICAgc3F1YXJlLnR5cGUgPSAndGlsZSc7XG4gICAgc3F1YXJlLmNvbGxpZGUgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgcmV0dXJuIHNxdWFyZTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblxuICAgIHtlbnRpdHk6ICd0ZXN0JywgcG9zOiB7eDogLTQwMCwgeTogLTQwNSwgcm90OiAwfX0sXG4gICAge2VudGl0eTogJ3Rlc3QnLCBwb3M6IHt4OiAtNDAwLCB5OiAtNDA1LCByb3Q6IDB9fVxuICAgIC8ve2VudGl0eTogJ3dhbGwnLCBwb3M6IHt4OiAtNDUwLCB5OiAtNDUwLCByb3Q6IDB9LCBkaW06IHt3OiAzMDAsIGg6IDMwMH19LFxuICAgIC8ve2VudGl0eTogJ3NxdWFyZScsIHBvczoge3g6IC0xMjUwLCB5OiAtMTI1MCwgcm90OiA0NX0sIGRpbToge3c6IDI1MDAsIGg6IDI1MDB9fVxuXG4gICAgLyp7ZW50aXR5OiAnVGlsZScsIHBvczoge3g6IDI1MDAsIHk6IDI1MDB9LCB3aWR0aDogNTAwMCwgaGVpZ2h0OiA1MDAwLCBwYXRoOiAnLi9pbWcvYmFja2dyb3VuZC5qcGcnfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAwLCB5OiAzOTAwLCByb3Q6IDB9LCB3aWR0aDogMTAwLCBoZWlnaHQ6IDI2MDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDAsIHk6IDExMDAsIHJvdDogMH0sIHdpZHRoOiAxMDAsIGhlaWdodDogMjIwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL3dhbGwucG5nJywgcG9zOiB7eDogMjUwMCwgeTogMCwgcm90OiAwfSwgd2lkdGg6IDUwMDAsIGhlaWdodDogMTAwfSxcbiAgICB7ZW50aXR5OiAnQmxvY2snLCBwYXRoOiAnLi9pbWcvd2FsbC5wbmcnLCBwb3M6IHt4OiAyNTAwLCB5OiA1MDAwLCByb3Q6IDB9LCB3aWR0aDogNTAwMCwgaGVpZ2h0OiAxMDB9LFxuICAgIHtlbnRpdHk6ICdCbG9jaycsIHBhdGg6ICcuL2ltZy93YWxsLnBuZycsIHBvczoge3g6IDUwMDAsIHk6IDI1MDAsIHJvdDogMH0sIHdpZHRoOiAxMDAsIGhlaWdodDogNTAwMH0sXG4gICAge2VudGl0eTogJ0Jsb2NrJywgcGF0aDogJy4vaW1nL2NhcjEucG5nJywgcG9zOiB7eDogMzAwLCB5OiAzMDAsIHJvdDogMn0sIHdpZHRoOiAyMDAsIGhlaWdodDogMzAwfSxcbiAgICB7ZW50aXR5OiAnWm9tYmllJywgaW1nOiAyLCBwb3M6IHt4OiAxOTAwLCB5OiAxNzAwLCByb3Q6IDB9fVxuKi9cbl07XG5cblxuIiwidmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciBtYWtlR2VvbWV0cnkgPSByZXF1aXJlKCcuL21ha2VHZW9tZXRyeS5qcycpO1xudmFyIG1ha2VTb2xpZCA9IHJlcXVpcmUoJy4vbWFrZVNvbGlkLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBvYmogPSBiYXNlRW50aXR5KCk7XG4gICAgb2JqLnJhZGl1cyA9IDEwO1xuICAgIG1ha2VHZW9tZXRyeShvYmosICdjaXJjbGUnKTtcbiAgICBtYWtlU29saWQob2JqKTtcbiAgICBvYmouYmFzZSA9ICdvYmonO1xuICAgIG9iai50eXBlID0gJ3Rlc3QnO1xuICAgIG9iai5tb3ZlKG9wdGlvbnMucG9zKTtcbiAgICBvYmouY29sbGlkZSA9IGZ1bmN0aW9uKCkge307XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxuIiwidmFyIHNwcml0ZXMgPSByZXF1aXJlKCcuL3Nwcml0ZXMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY2hhcmFjdGVyOiB7XG4gICAgICAgIHpvbWJpZTogeyBcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy56b21iaWUyLmZyYW1lLFxuICAgICAgICAgICAgcG9zZXM6IHtcbiAgICAgICAgICAgICAgICB4OiA2LFxuICAgICAgICAgICAgICAgIHk6IDQsXG4gICAgICAgICAgICAgICAgc2xpZGVzOiBbNiwgNSwgMiwgM11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgem9tYmllMjogeyBcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy56b21iaWUyLmZyYW1lLFxuICAgICAgICAgICAgcG9zZXM6IHtcbiAgICAgICAgICAgICAgICB4OiA2LFxuICAgICAgICAgICAgICAgIHk6IDIsXG4gICAgICAgICAgICAgICAgc2xpZGVzOiBbNiwgNV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgem9tYmllMzogeyBcbiAgICAgICAgICAgIGZyYW1lOiBzcHJpdGVzLmZyYW1lcy56b21iaWUzLmZyYW1lLFxuICAgICAgICAgICAgcG9zZXM6IHtcbiAgICAgICAgICAgICAgICB4OiA2LFxuICAgICAgICAgICAgICAgIHk6IDIsXG4gICAgICAgICAgICAgICAgc2xpZGVzOiBbNiwgNV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGxheWVyOiB7IFxuICAgICAgICAgICAgZnJhbWU6IHNwcml0ZXMuZnJhbWVzLnBsYXllci5mcmFtZSxcbiAgICAgICAgICAgIHBvc2VzOiB7XG4gICAgICAgICAgICAgICAgeDogNixcbiAgICAgICAgICAgICAgICB5OiAyLFxuICAgICAgICAgICAgICAgIHNsaWRlczogWzYsIDVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHByb2plY3RpbGU6IHtcbiAgICAgICAgYnVsbGV0OiB7XG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMuYnVsbGV0LmZyYW1lXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNxdWFyZToge1xuICAgICAgICB0aWxlOiB7XG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMud2FsbC5mcmFtZVxuICAgICAgICB9LFxuICAgICAgICB3YWxsOiB7XG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMud2FsbC5mcmFtZVxuICAgICAgICB9LFxuICAgICAgICBkb29yOiB7XG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMud2FsbC5mcmFtZVxuICAgICAgICB9XG4gICAgfSxcbiAgICB3ZWFwb246IHtcbiAgICAgICAgZ3VuOiB7XG4gICAgICAgICAgICBmcmFtZTogc3ByaXRlcy5mcmFtZXMucGlzdG9sLmZyYW1lXG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwidmFyIHNxdWFyZSA9IHJlcXVpcmUoJy4vc3F1YXJlLmpzJyk7XG52YXIgbWFrZVNvbGlkID0gcmVxdWlyZSgnLi9tYWtlU29saWQuanMnKTtcbnZhciBtYWtlVmlzaWJsZSA9IHJlcXVpcmUoJy4vbWFrZVZpc2libGUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyICB3YWxsID0gc3F1YXJlKG9wdGlvbnMpO1xuICAgIG1ha2VWaXNpYmxlKHdhbGwpO1xuICAgIHdhbGwub25Ub3AgPSB0cnVlO1xuICAgIG1ha2VTb2xpZCh3YWxsKTtcbiAgICB3YWxsLnR5cGUgPSAnd2FsbCc7XG5cbiAgICByZXR1cm4gd2FsbDtcbn07XG4iLCJ2YXIgbWFrZVZpc2libGUgPSByZXF1aXJlKCcuL21ha2VWaXNpYmxlLmpzJyk7XG52YXIgbWFrZUludmVudG9yeSA9IHJlcXVpcmUoJy4vbWFrZUludmVudG9yeS5qcycpO1xudmFyIGJhc2VFbnRpdHkgPSByZXF1aXJlKCcuL2Jhc2VFbnRpdHkuanMnKTtcbnZhciBtYWtlU29saWQgPSByZXF1aXJlKCcuL21ha2VTb2xpZC5qcycpO1xudmFyIG1ha2VHZW9tZXRyeSA9IHJlcXVpcmUoJy4vbWFrZUdlb21ldHJ5LmpzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2VhcG9uID0gYmFzZUVudGl0eSgpO1xuICAgIG1ha2VHZW9tZXRyeSh3ZWFwb24sICdjaXJjbGUnKTtcbiAgICBtYWtlU29saWQod2VhcG9uKTtcbiAgICBtYWtlVmlzaWJsZSh3ZWFwb24pO1xuICAgIG1ha2VJbnZlbnRvcnkod2VhcG9uKTtcbiAgICB3ZWFwb24uYmFzZSA9ICd3ZWFwb24nO1xuICAgIHdlYXBvbi5yYWRpdXMgPSAnMTAnO1xuICAgIHdlYXBvbi5jb29sRG93biA9IDU7XG4gICAgd2VhcG9uLmNvbnNvbGlkYXRlSW52ZW50b3J5ID0gdHJ1ZTtcbiAgICB3ZWFwb24uY29sbGlkZSA9IGZ1bmN0aW9uKGNvbGxpZGVyKSB7XG4gICAgICAgIHN3aXRjaCAoY29sbGlkZXIudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAncGxheWVyJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHJldHVybiB3ZWFwb247XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgbWF0cml4U3RhY2sgPSByZXF1aXJlKCcuL21hdHJpeFN0YWNrLmpzJyk7XG52YXIgZ2V0ID0gcmVxdWlyZSgnLi9nZXQuanMnKTtcbm1hdHJpeFN0YWNrID0gbmV3IG1hdHJpeFN0YWNrKCk7XG5cbnZhciBnbCwgZHJhd1NxdWFyZXMsIGRyYXdDaXJjbGVzLCBzZXRVcENhbWVyYSwgdGV4dHVyZSwgY2lyY2xlVmVydFNoYWRlciwgc3F1YXJlVmVydFNoYWRlciwgY2lyY2xlRnJhZ1NoYWRlciwgc3F1YXJlRnJhZ1NoYWRlciwgaXNMb2FkZWQ7XG52YXIgY2FudmFzU3BhY2UgPSB7fTtcbnZhciBhc3NldHMgPSAwO1xuY2FudmFzU3BhY2Uud2lkdGggPSAzMDAwO1xuY2FudmFzU3BhY2UuaGVpZ2h0ID0gMTUwMDtcblxudmFyIGxvYWRlZEFzc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgYXNzZXRzKys7XG4gICAgaWYgKGFzc2V0cyA9PT0gNSkgbG9hZGVkKCk7XG59O1xuXG5nZXQoJy4uL2dsc2wvY2lyY2xlLnZlcnQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgY2lyY2xlVmVydFNoYWRlciA9IGRhdGE7XG4gICAgbG9hZGVkQXNzZXQoKTtcbn0pO1xuXG5nZXQoJy4uL2dsc2wvc3F1YXJlLnZlcnQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgc3F1YXJlVmVydFNoYWRlciA9IGRhdGE7XG4gICAgbG9hZGVkQXNzZXQoKTtcbn0pO1xuXG5nZXQoJy4uL2dsc2wvY2lyY2xlLmZyYWcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgY2lyY2xlRnJhZ1NoYWRlciA9IGRhdGE7XG4gICAgbG9hZGVkQXNzZXQoKTtcbn0pO1xuXG5nZXQoJy4uL2dsc2wvc3F1YXJlLmZyYWcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgc3F1YXJlRnJhZ1NoYWRlciA9IGRhdGE7XG4gICAgbG9hZGVkQXNzZXQoKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIGxvYWRlZEFzc2V0KCk7XG59KTtcblxudmFyIGxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlzTG9hZGVkID0gdHJ1ZTtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgY2FudmFzU3BhY2Uud2lkdGgpO1xuICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIGNhbnZhc1NwYWNlLmhlaWdodCk7XG4gICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgICB2YXIgZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKFwiQU5HTEVfaW5zdGFuY2VkX2FycmF5c1wiKTsgLy8gVmVuZG9yIHByZWZpeGVzIG1heSBhcHBseSFcblxuXG5cbiAgICAvLyBHZXQgQSBXZWJHTCBjb250ZXh0XG4gICAgLyoqIEB0eXBlIHtIVE1MQ2FudmFzRWxlbWVudH0gKi9cblxuXG4gICAgLy8gc2V0dXAgR0xTTCBwcm9ncmFtXG4gICAgdmFyIGNpcmNsZXNQcm9ncmFtID0gd2ViZ2xVdGlscy5jcmVhdGVQcm9ncmFtRnJvbVNvdXJjZXMoZ2wsIFtjaXJjbGVWZXJ0U2hhZGVyLCBjaXJjbGVGcmFnU2hhZGVyXSk7XG4gICAgdmFyIHNxdWFyZXNQcm9ncmFtID0gd2ViZ2xVdGlscy5jcmVhdGVQcm9ncmFtRnJvbVNvdXJjZXMoZ2wsIFtzcXVhcmVWZXJ0U2hhZGVyLCBzcXVhcmVGcmFnU2hhZGVyXSk7XG5cbiAgICAvLyBsb29rIHVwIHdoZXJlIHRoZSB2ZXJ0ZXggZGF0YSBuZWVkcyB0byBnby5cbiAgICB2YXIgY2lyY2xlUG9zaXRpb25Mb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcImFfcG9zaXRpb25cIik7XG4gICAgdmFyIGNpcmNsZVRleGNvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJhX3RleGNvb3JkXCIpO1xuICAgIHZhciBjaXJjbGVJbnN0YW5jZUxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwiYV9pbnN0YW5jZVwiKTtcbiAgICB2YXIgY2lyY2xlVGV4dHVyZXNMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGNpcmNsZXNQcm9ncmFtLCBcImFfcG9zZVwiKTtcbiAgICB2YXIgc3F1YXJlUG9zaXRpb25Mb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcImFfcG9zaXRpb25cIik7XG4gICAgdmFyIHNxdWFyZVRleGNvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcXVhcmVzUHJvZ3JhbSwgXCJhX3RleGNvb3JkXCIpO1xuICAgIHZhciBzcXVhcmVJbnN0YW5jZUxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwiYV9pbnN0YW5jZVwiKTtcbiAgICB2YXIgc3F1YXJlVGV4dHVyZXNMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcImFfcG9zZVwiKTtcbiAgICB2YXIgc3F1YXJlRGltc0xvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwiYV9kaW1cIik7XG5cbiAgICAvLyBsb29rdXAgdW5pZm9ybXNcbiAgICB2YXIgY2lyY2xlQ2FtZXJhTWF0cml4TG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwidV9jYW1lcmFNYXRyaXhcIik7XG4gICAgdmFyIGNpcmNsZUNhbnZhc0RpbXNMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihjaXJjbGVzUHJvZ3JhbSwgXCJ1X2NhbnZhc0RpbXNcIik7XG4gICAgdmFyIHNxdWFyZUNhbWVyYU1hdHJpeExvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNxdWFyZXNQcm9ncmFtLCBcInVfY2FtZXJhTWF0cml4XCIpO1xuICAgIHZhciBzcXVhcmVDYW52YXNEaW1zTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwidV9jYW52YXNEaW1zXCIpO1xuICAgIHZhciBzcXVhcmVUZXh0dXJlTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3F1YXJlc1Byb2dyYW0sIFwidV90ZXh0dXJlXCIpO1xuICAgIHZhciBjaXJjbGVUZXh0dXJlTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oY2lyY2xlc1Byb2dyYW0sIFwidV90ZXh0dXJlXCIpO1xuXG4gICAgdmFyIGRpbXNCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZGltc0J1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIFswLCAwLCAwXSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgdmFyIHRleHR1cmVCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZUJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIFswLCAwLCAwXSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgdmFyIGluc3RhbmNlQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlQnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgWzAsIDAsIDBdLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgLy8gQ3JlYXRlIGEgYnVmZmVyLlxuICAgIHZhciBwb3NpdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlcik7XG5cbiAgICB2YXIgcG9zaXRpb25zID0gW1xuICAgICAgICAtLjUsIC0uNSxcbiAgICAgICAgLS41LCAuNSxcbiAgICAgICAgLjUsIC0uNSxcbiAgICAgICAgLjUsIC0uNSxcbiAgICAgICAgLS41LCAuNSxcbiAgICAgICAgLjUsIC41XG4gICAgXTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAvLyBDcmVhdGUgYSBidWZmZXIgZm9yIHRleHR1cmUgY29vcmRzXG4gICAgdmFyIHRleGNvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleGNvb3JkQnVmZmVyKTtcblxuICAgIC8vIFB1dCB0ZXhjb29yZHMgaW4gdGhlIGJ1ZmZlclxuICAgIHZhciB0ZXhjb29yZHMgPSBbXG4gICAgICAgIDAsIDAsXG4gICAgICAgIDAsIDEsXG4gICAgICAgIDEsIDAsXG4gICAgICAgIDEsIDAsXG4gICAgICAgIDAsIDEsXG4gICAgICAgIDEsIDFcbiAgICBdO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHRleGNvb3JkcyksIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIC8vIGNyZWF0ZXMgYSB0ZXh0dXJlIGluZm8geyB3aWR0aDogdywgaGVpZ2h0OiBoLCB0ZXh0dXJlOiB0ZXggfVxuICAgIC8vIFRoZSB0ZXh0dXJlIHdpbGwgc3RhcnQgd2l0aCAxeDEgcGl4ZWxzIGFuZCBiZSB1cGRhdGVkXG4gICAgLy8gd2hlbiB0aGUgaW1hZ2UgaGFzIGxvYWRlZFxuICAgIGZ1bmN0aW9uIGxvYWRJbWFnZUFuZENyZWF0ZVRleHR1cmVJbmZvKHVybCkge1xuICAgICAgICB2YXIgdGV4ID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xuICAgICAgICAvLyBGaWxsIHRoZSB0ZXh0dXJlIHdpdGggYSAxeDEgYmx1ZSBwaXhlbC5cbiAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCAxLCAxLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KFswLCAwLCAyNTUsIDI1NV0pKTtcblxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5SRVBFQVQpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCk7XG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcblxuICAgICAgICB2YXIgdGV4dHVyZUluZm8gPSB7XG4gICAgICAgICAgICB3aWR0aDogMSwgICAvLyB3ZSBkb24ndCBrbm93IHRoZSBzaXplIHVudGlsIGl0IGxvYWRzXG4gICAgICAgICAgICBoZWlnaHQ6IDEsXG4gICAgICAgICAgICB0ZXh0dXJlOiB0ZXgsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRleHR1cmVJbmZvLndpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICAgICAgdGV4dHVyZUluZm8uaGVpZ2h0ID0gaW1nLmhlaWdodDtcblxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZUluZm8udGV4dHVyZSk7XG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XG4gICAgICAgICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGltZy5zcmMgPSB1cmw7XG5cbiAgICAgICAgcmV0dXJuIHRleHR1cmVJbmZvO1xuICAgIH07XG5cbiAgICB0ZXh0dXJlID0gbG9hZEltYWdlQW5kQ3JlYXRlVGV4dHVyZUluZm8oJy4vaW1nL3Nwcml0ZXNoZWV0LnBuZycpO1xuXG4gICAgc2V0VXBDYW1lcmEgPSBmdW5jdGlvbihwb3YpIHtcbiAgICAgICAgdmFyIG9ydGhvID0gbTQub3J0aG9ncmFwaGljKDAsIGNhbnZhc1NwYWNlLndpZHRoLCBjYW52YXNTcGFjZS5oZWlnaHQsIDAsIC0xLCAxKTtcbiAgICAgICAgZ2wudXNlUHJvZ3JhbShzcXVhcmVzUHJvZ3JhbSk7XG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc3F1YXJlQ2FtZXJhTWF0cml4TG9jYXRpb24sIGZhbHNlLCBvcnRobyk7XG4gICAgICAgIGdsLnVuaWZvcm0yZihzcXVhcmVDYW52YXNEaW1zTG9jYXRpb24sIGNhbnZhc1NwYWNlLndpZHRoIC8gMiAtIHBvdi54LCBjYW52YXNTcGFjZS5oZWlnaHQgLyAyIC0gcG92LnkpO1xuICAgICAgICBnbC51c2VQcm9ncmFtKGNpcmNsZXNQcm9ncmFtKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihjaXJjbGVDYW1lcmFNYXRyaXhMb2NhdGlvbiwgZmFsc2UsIG9ydGhvKTtcbiAgICAgICAgZ2wudW5pZm9ybTJmKGNpcmNsZUNhbnZhc0RpbXNMb2NhdGlvbiwgY2FudmFzU3BhY2Uud2lkdGggLyAyIC0gcG92LngsIGNhbnZhc1NwYWNlLmhlaWdodCAvIDIgLSBwb3YueSk7XG4gICAgfTtcblxuICAgIGRyYXdTcXVhcmVzID0gZnVuY3Rpb24oaW5zdGFuY2VzLCBkaW1zLCB0ZXh0dXJlcykge1xuXG4gICAgICAgIGdsLnVzZVByb2dyYW0oc3F1YXJlc1Byb2dyYW0pO1xuXG4gICAgICAgIHZhciBpbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VzLmxlbmd0aCAvIDM7XG4gICAgICAgIGluc3RhbmNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoaW5zdGFuY2VzKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlcywgZ2wuRFlOQU1JQ19EUkFXLCAwLCBpbnN0YW5jZXMubGVuZ3RoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc3F1YXJlSW5zdGFuY2VMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc3F1YXJlSW5zdGFuY2VMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCAxMiwgMCk7XG4gICAgICAgIGV4dC52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUoc3F1YXJlSW5zdGFuY2VMb2NhdGlvbiwgMSk7IFxuXG4gICAgICAgIGRpbXMgPSBuZXcgRmxvYXQzMkFycmF5KGRpbXMpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZGltc0J1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkaW1zLCBnbC5EWU5BTUlDX0RSQVcsIDAsIGRpbXMubGVuZ3RoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc3F1YXJlRGltc0xvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzcXVhcmVEaW1zTG9jYXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgOCwgMCk7XG4gICAgICAgIGV4dC52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUoc3F1YXJlRGltc0xvY2F0aW9uLCAxKTsgXG5cbiAgICAgICAgdGV4dHVyZXMgPSBuZXcgRmxvYXQzMkFycmF5KHRleHR1cmVzKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZXMsIGdsLkRZTkFNSUNfRFJBVywgMCwgdGV4dHVyZXMubGVuZ3RoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc3F1YXJlVGV4dHVyZXNMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc3F1YXJlVGV4dHVyZXNMb2NhdGlvbiwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAxNiwgMCk7XG4gICAgICAgIGV4dC52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUoc3F1YXJlVGV4dHVyZXNMb2NhdGlvbiwgMSk7IFxuXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlcik7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNxdWFyZVBvc2l0aW9uTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNxdWFyZVBvc2l0aW9uTG9jYXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXhjb29yZEJ1ZmZlcik7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNxdWFyZVRleGNvb3JkTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNxdWFyZVRleGNvb3JkTG9jYXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgZ2wudW5pZm9ybTFpKHNxdWFyZVRleHR1cmVMb2NhdGlvbiwgMCk7XG5cbiAgICAgICAgZXh0LmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShnbC5UUklBTkdMRVMsIDAsIDYsIGluc3RhbmNlQ291bnQpO1xuXG4gICAgfTtcblxuICAgIGRyYXdDaXJjbGVzID0gZnVuY3Rpb24oaW5zdGFuY2VzLCB0ZXh0dXJlcykge1xuXG4gICAgICAgIGdsLnVzZVByb2dyYW0oY2lyY2xlc1Byb2dyYW0pO1xuXG4gICAgICAgIHZhciBpbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VzLmxlbmd0aCAvIDQ7XG4gICAgICAgIGluc3RhbmNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoaW5zdGFuY2VzKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlcywgZ2wuRFlOQU1JQ19EUkFXLCAwLCBpbnN0YW5jZXMubGVuZ3RoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoY2lyY2xlSW5zdGFuY2VMb2NhdGlvbik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoY2lyY2xlSW5zdGFuY2VMb2NhdGlvbiwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAxNiwgMCk7XG4gICAgICAgIGV4dC52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUoY2lyY2xlSW5zdGFuY2VMb2NhdGlvbiwgMSk7IFxuXG4gICAgICAgIHRleHR1cmVzID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlcyk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0ZXh0dXJlQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVzLCBnbC5EWU5BTUlDX0RSQVcsIDAsIHRleHR1cmVzLmxlbmd0aCk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGNpcmNsZVRleHR1cmVzTG9jYXRpb24pO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGNpcmNsZVRleHR1cmVzTG9jYXRpb24sIDQsIGdsLkZMT0FULCBmYWxzZSwgMTYsIDApO1xuICAgICAgICBleHQudmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGNpcmNsZVRleHR1cmVzTG9jYXRpb24sIDEpOyBcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcG9zaXRpb25CdWZmZXIpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShjaXJjbGVQb3NpdGlvbkxvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihjaXJjbGVQb3NpdGlvbkxvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4Y29vcmRCdWZmZXIpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShjaXJjbGVUZXhjb29yZExvY2F0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihjaXJjbGVUZXhjb29yZExvY2F0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG5cbiAgICAgICAgZ2wudW5pZm9ybTFpKGNpcmNsZVRleHR1cmVMb2NhdGlvbiwgMCk7XG5cbiAgICAgICAgXG4gICAgICAgIGV4dC5kcmF3QXJyYXlzSW5zdGFuY2VkQU5HTEUoZ2wuVFJJQU5HTEVTLCAwLCA2LCBpbnN0YW5jZUNvdW50KTtcblxuICAgIH07XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRyYXdDaXJjbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZHJhd0NpcmNsZXMuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9LFxuICAgIGRyYXdTcXVhcmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZHJhd1NxdWFyZXMuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9LFxuICAgIHNldFVwQ2FtZXJhOiBmdW5jdGlvbihwb3YpIHtcbiAgICAgICAgc2V0VXBDYW1lcmEocG92KTtcbiAgICB9LFxuICAgIGlzTG9hZGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGlzTG9hZGVkO1xuICAgIH0sXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXNTcGFjZS53aWR0aCwgY2FudmFzU3BhY2UuaGVpZ2h0KTtcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfSxcbiAgICBtYXRyaXg6IG1hdHJpeFN0YWNrLFxuICAgIGdldFRleHR1cmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGV4dHVyZTtcbiAgICB9LFxuICAgIGNhbnZhc0RpbWVuc2lvbnM6IHtcbiAgICAgICAgeDogY2FudmFzU3BhY2Uud2lkdGgsXG4gICAgICAgIHk6IGNhbnZhc1NwYWNlLmhlaWdodFxuICAgIH1cbn07XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBsZXZlbCA9IHt9O1xubGV2ZWwuZ2FtZSA9IHJlcXVpcmUoJy4vbGV2ZWwuanMnKTtcbmxldmVsLnRlc3QgPSByZXF1aXJlKCcuL3Rlc3QtbGV2ZWwuanMnKTtcbnZhciBFbnRpdGllcyA9IHJlcXVpcmUoJy4vZ2V0RW50aXRpZXMuanMnKTtcbnZhciBjaXJjbGVzID0gW107XG52YXIgc3F1YXJlcyA9IFtdO1xudmFyIHBvaW50cyA9IFtdO1xudmFyIHhzID0gW107XG5cbnZhciBnZXQgPSByZXF1aXJlKCcuL2dldC5qcycpO1xuXG52YXIgd29ybGQgPSBbXTtcbnZhciBuZXdJdGVtcyA9IFtdO1xudmFyIHVuaXZlcnNhbERlY29yYXRvcnMgPSBbXTtcbnZhciBsZXZlbE1ldGFkYXRhID0ge307XG5cbnZhciBhcGkgPSB7XG4gICAgZ2V0T2JqQnlOYW1lOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB3b3JsZC5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBpdGVtKSB7IGlmIChpdGVtLmdldE9iak5hbWUoKSA9PT0gbmFtZSkgcmV0dXJuIGl0ZW07IH0sIG51bGwpO1xuICAgIH0sXG4gICAgc2V0TGV2ZWxNZXRhZGF0YTogZnVuY3Rpb24obmV3RGF0YSkge1xuICAgICAgICBmb3IgKHZhciB2YWwgaW4gbmV3RGF0YSkge1xuICAgICAgICAgICAgbGV2ZWxNZXRhZGF0YVt2YWxdID0gbmV3RGF0YVt2YWxdO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50cy5lbWl0KCd1cGRhdGVMZXZlbE5hbWUnKTtcbiAgICB9LFxuICAgIGdldExldmVsTWV0YWRhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbGV2ZWxNZXRhZGF0YTtcbiAgICB9LFxuICAgIGRlY29yYXRlQWxsSXRlbXM6IGZ1bmN0aW9uKGRlY29yYXRvcikge1xuICAgICAgICB3b3JsZC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgZGVjb3JhdG9yKGl0ZW0pOyB9KTtcbiAgICAgICAgdW5pdmVyc2FsRGVjb3JhdG9ycy5wdXNoKGRlY29yYXRvcik7XG4gICAgfSxcbiAgICB1bmxvYWRXb3JsZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdvcmxkLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS51bmxvYWQoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFwaS5zZXRMZXZlbE1ldGFkYXRhKHtcbiAgICAgICAgICAgIGlkOiBudWxsLFxuICAgICAgICAgICAgbmFtZTogbnVsbFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGxvYWRMZXZlbDogZnVuY3Rpb24obGV2ZWxJZCwgY2FsbGJhY2spIHtcbiAgICAgICAgYXBpLnVubG9hZFdvcmxkKCk7XG4gICAgICAgIGdldCgnLi9sZXZlbHMvJyArIGxldmVsSWQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGFwaS5sb2FkSXRlbXMoSlNPTi5wYXJzZShkYXRhLmRhdGEpKTtcbiAgICAgICAgICAgIGFwaS5zdGVwKCk7XG4gICAgICAgICAgICBhcGkuc2V0TGV2ZWxNZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgIGlkOiBkYXRhLmlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFwaS5zb3J0SXRlbXMoKTtcbiAgICB9LFxuICAgIGxvYWRJdGVtczogZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gW2l0ZW1zXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGl0ZW1zID0gaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBlbnRpdHkgPSBpdGVtO1xuICAgICAgICAgICAgaWYgKCFlbnRpdHkudHlwZSkgZW50aXR5ID0gRW50aXRpZXNbaXRlbS5lbnRpdHldKGl0ZW0pO1xuICAgICAgICAgICAgZW50aXR5LmxvYWQoKTtcbiAgICAgICAgICAgIHVuaXZlcnNhbERlY29yYXRvcnMuZm9yRWFjaChmdW5jdGlvbihkZWNvcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBkZWNvcmF0b3IoZW50aXR5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld0l0ZW1zID0gbmV3SXRlbXMuY29uY2F0KGl0ZW1zKTtcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDEpIHJldHVybiBpdGVtcztcbiAgICAgICAgcmV0dXJuIGl0ZW1zWzBdO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd29ybGQuc2xpY2UoKTtcbiAgICB9LFxuICAgIGdldEl0ZW1CeUlkOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gd29ybGQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmlkID09PSBpZCkgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pWzBdO1xuICAgIH0sXG4gICAgZ2V0SXRlbXNCeVR5cGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS50eXBlID09PSB0eXBlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB3b3JsZCA9IHdvcmxkLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7IGlmIChpdGVtLmlkICE9PSBpZCkgcmV0dXJuIHRydWU7IH0pO1xuICAgICAgICBldmVudHMuZW1pdCgnZW50aXR5Q291bnQnKTtcbiAgICB9LFxuICAgIGdldFhzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHhzO1xuICAgIH0sXG4gICAgdXBkYXRlTmV3SXRlbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3b3JsZCA9IHdvcmxkLmNvbmNhdChuZXdJdGVtcyk7XG4gICAgICAgIGFwaS5zb3J0SXRlbXMoKTtcbiAgICAgICAgaWYgKG5ld0l0ZW1zLmxlbmd0aCkgZXZlbnRzLmVtaXQoJ2VudGl0eUNvdW50Jyk7XG4gICAgICAgIG5ld0l0ZW1zID0gW107XG4gICAgfSxcbiAgICBzdGVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBpLnVwZGF0ZU5ld0l0ZW1zKCk7XG4gICAgICAgIHhzID0gW107XG4gICAgICAgIHlzID0gW107XG4gICAgICAgIG5ld0l0ZW1zID0gW107XG4gICAgICAgIGNpcmNsZXMgPSBbXTtcbiAgICAgICAgc3F1YXJlcyA9IFtdO1xuICAgICAgICBwb2ludHMgPSBbXTtcbiAgICAgICAgd29ybGQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IFxuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgPT09ICdjaXJjbGUnICYmIGl0ZW0udmlzaWJsZSkgY2lyY2xlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgPT09ICdzcXVhcmUnICYmIGl0ZW0udmlzaWJsZSkgc3F1YXJlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgPT09ICdwb2ludCcgJiYgaXRlbS52aXNpYmxlKSBwb2ludHMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIGl0ZW0uY29sbGlzaW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgaXRlbS5zdGVwLmNhbGwoaXRlbSk7IFxuICAgICAgICAgICAgaWYgKGl0ZW0uZ2VvbWV0cnkgJiYgaXRlbS5zb2xpZCAmJiAhaXRlbS5pbkNvbnRhaW5lcigpKSB4cyA9IHhzLmNvbmNhdChpdGVtLkFBQkIueHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXBpLnNvcnRJdGVtcygpO1xuICAgICAgICB4cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoYS52YWwgLSBiLnZhbCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc29ydEl0ZW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgd29ybGQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5vblRvcDtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRHZW9tZXRyeTogZnVuY3Rpb24oZ2VvbWV0cnkpIHtcbiAgICAgICAgaWYgKGdlb21ldHJ5ID09PSAnY2lyY2xlJykgcmV0dXJuIGNpcmNsZXM7XG4gICAgICAgIGlmIChnZW9tZXRyeSA9PT0gJ3NxdWFyZScpIHJldHVybiBzcXVhcmVzO1xuICAgICAgICBpZiAoZ2VvbWV0cnkgPT09ICdwb2ludCcpIHJldHVybiBwb2ludHM7XG4gICAgfSxcbiAgICBnZXRBbGxJdGVtc1NvcnRlZEJ5R2VvbWV0cnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW3NxdWFyZXMsIGNpcmNsZXMsIHBvaW50c107XG4gICAgfSxcbiAgICBnZXRFbnRpdHlUeXBlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbnRpdGllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBlbnRpdHkgaW4gRW50aXRpZXMpIHtcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
