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
