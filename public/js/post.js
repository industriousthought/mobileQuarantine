
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

