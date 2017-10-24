
module.exports = function(items) {
    console.log('***************************************-------');
    items.forEach(function(item) {
        console.log(item.id + '-' + item.type + '-x:' + item.pos.x + '-y:' + item.pos.y);
    });
};
