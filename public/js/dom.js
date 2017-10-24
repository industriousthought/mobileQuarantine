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
