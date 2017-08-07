// define a user behaviour
var ServerManager = qc.defineBehaviour('qc.wtf.ServerManager', qc.Behaviour, function() {
	ServerManager.instance = this;
    this.address = "ws://192.168.16.45:8080/TestServer/server";
}, {
    address: qc.Serializer.STRING
});

ServerManager.prototype.awake = function() {
	wh.Server.address = this.address;
	if(window['address']){
		wh.Server.address = window['address'];
	}
	wh.Event.bind('ON_MESSAGE', this.onMessage, this);
};

ServerManager.prototype.connect = function() {
	wh.Server.connect();
};

ServerManager.prototype.close = function() {
	wh.Server.socket.close();
};

ServerManager.prototype._send = function(data) {
	wh.Server.send(data);
};

ServerManager.prototype.onMessage = function(data) {
	var message = wh.Base64.decode(data);
	var json = JSON.parse(message);
	//console.log(message);
	wh.Event.call(json.k, json.v);
};

ServerManager.prototype.sendMessage = function(key, pack) {
	var p = {
		k: key,
		v: pack
	};
	var text = JSON.stringify(p);
	var encodeText = wh.Base64.encode(text);
	this._send(encodeText);
};
