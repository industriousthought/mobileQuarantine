
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

