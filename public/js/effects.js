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
