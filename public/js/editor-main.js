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






