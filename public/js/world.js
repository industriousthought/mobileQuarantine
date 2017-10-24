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
