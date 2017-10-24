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
