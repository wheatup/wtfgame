if(!wh){
	var wh = {};
}
wh.Server = {
	address: "ws://localhost:8010/TestServer/server",
	socket: null,

	connect: function(){
		if(window['address']){
			wh.Server.address = window['address'];
		}
		wh.Server.socket = new WebSocket(wh.Server.address);
		console.log("正在连接至服务器...");
		wh.Server.socket.onopen = function(event){
			wh.Server.socket.onmessage = wh.Server.onMessage;
			wh.Server.socket.onclose = wh.Server.onClose;
			wh.Server.socket.onerror = wh.Server.onError;
			wh.Server.onOpen(event);
		};
	},

	onOpen: function(event){
		console.log("成功连接到服务器。");
		wh.Event.call('ON_OPEN');
	},

	onMessage: function(event){
		//console.log("收到消息:\n" + event.data);
		wh.Event.call('ON_MESSAGE', event.data);
	},

	onError: function(event){
		//console.log("收到消息:\n" + event.data);
		wh.Event.call('ON_ERROR', event.data);
	},

	onClose: function(event){
		console.log("从服务器断开:" + event.data);
		wh.Event.call('ON_CLOSE', event.data);
	},

	send: function(msg){
		wh.Server.socket.send(msg);
	}
};
