var GameManager = qc.defineBehaviour('qc.wtf.GameManager', qc.Behaviour, function() {
	GameManager.instance = this;
	this.sceneStuff = [];
	this.players = [];
	this.me = null;
	this.playerMap = {};
	this.tick = 0;
	this.flashTick = 0;

	this.currentLevel = null;
	this.num = 1;
	this.myName = 'Player';
	this.myUUID = -1;
    this.myScore = 0;
	this.myTitle = "";
	this.channel = 0;
	this.lastChannel = -1;
	this.mapData = null;
	this.ignoreList = [];
	this.isAdmin = false;
	this.god = false;
	this.mode = "unknown";
}, {
	map: qc.Serializer.NODE,
	flash: qc.Serializer.NODE,
	camera: qc.Serializer.NODE,
	playerPrefab: qc.Serializer.PREFAB,
	plankPrefab: qc.Serializer.PREFAB,
	levels: qc.Serializer.NODES,
	pLevels: qc.Serializer.NODES,
	pyLevel: qc.Serializer.NODE,
    sceneStuff: qc.Serializer.NODES,
	players: qc.Serializer.NODES,
	version: qc.Serializer.STRING
});

GameManager.prototype.awake = function() {
	//wh.Tween.init(this.game);
	this.game.input.onKeyDown.add(this.onKeyDown, this);
	this.game.input.onKeyUp.add(this.onKeyUp, this);
	wh.Event.bind('$room', this.onGetRoom, this);
	wh.Event.bind('$newmap', this.onSwitchMap, this);
	wh.Event.bind('$newplayer', this.onNewPlayer, this);
	wh.Event.bind('$playerdata', this.onGetPlayerData, this);
	this.gameObject.visible = false;

	wh.Event.bind('$move', this.onReceiveMove, this);
	wh.Event.bind('$leave', this.onLeave, this);
	wh.Event.bind('$score', this.onScore, this);
	wh.Event.bind('$msg', this.onMsg, this);
	wh.Event.bind('$flash', this.onFlash, this);
	wh.Event.bind('$infect', this.onInfect, this);
	wh.Event.bind('$source', this.onSource, this);
	wh.Event.bind('$alert', this.onAlert, this);
	wh.Event.bind('$afkkick', this.onAFKKick, this);
	wh.Event.bind('$kick', this.onKick, this);

	wh.Event.bind('$fullsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 5;
				}
				p.Player.showLabel("+5");
			}
		}

	}, this);

	wh.Event.bind('$halfsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 1;
				}
				p.Player.showLabel("+1");
			}
		}
	}, this);

	wh.Event.bind('$sur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			var p = this.playerMap["p" + uuid];
			if(p && p.Player){
				if(p.Player.isMe){
					GameManager.instance.myScore += 3;
				}
				p.Player.showLabel("+3");
			}
		}
	}, this);

	wh.Event.bind('$key', function(data){
		if(window.localStorage){
			window.localStorage.setItem("key", data.key);
		}
	}, this);

	wh.Event.bind('$title', function(data){
		var p = this.playerMap["p" + data.uuid];
		if(p && p.Player){
			p.Player.setTitle(data.title);
			if(p.Player == this.me){
				this.myTitle = data.title;
			}
		}
	}, this);

	wh.Event.bind('$god', function(){
		this.god = !this.god;
		this.me.showLabel(this.god ? "开启上帝模式" : "关闭上帝模式");
	}, this);

	wh.Event.bind('$admin', function(){
		this.isAdmin = true;
		this.me.showLabel("已获取管理员权限");
	}, this);

	this.game.input.onKeyDown.add(this.onKeyDown, this);
};

GameManager.prototype.onInfect = function(data) {
	if(this.mode != "plague") return;
	var s = data.s;
	var m = data.m;

	if(s){
		var sp = this.playerMap["p" + s];
		if(sp && sp.Player){
			sp.Player.infectOther();
			if(sp.Player.isMe){
				GameManager.instance.myScore += 1;
			}
		}
	}

	if(m){
		var mp = this.playerMap["p" + m];
		if(mp && mp.Player){
			mp.Player.infect(false, false);
		}
	}
};

GameManager.prototype.onSource = function(data) {
	if(this.mode != "plague") return;
	var mp = this.playerMap["p" + data.uuid];
	if(mp && mp.Player){
		mp.Player.infect(true, true);
	}
};

GameManager.prototype.onAFKKick = function(data) {
	alert("您AFK太久，被移出游戏了！");
	location.reload();
};

GameManager.prototype.onKick = function(data) {
	alert("您被管理员请出游戏了！");
	location.reload();
};

GameManager.prototype.onReceiveMove = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onReceiveMove(data);
	}
};

GameManager.prototype.onLeave = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onLeave(data);
	}
};

GameManager.prototype.onScore = function(data) {
	if(this.mode != "race") return;
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		p.Player.onScore(data);
		if(p.Player.isMe){
			GameManager.instance.myScore += data.score;
		}
	}

};

GameManager.prototype.onMsg = function(data) {
	var p = this.playerMap["p" + data.uuid];
	if(p && p.Player){
		if(this.ignoreList.indexOf(data.uuid) >= 0){
			return;
		}
		p.Player.onMsg(data);
	}
};

GameManager.prototype.onFlash = function(data) {
	if(this.mode != "race") return;
	this.flashTick = this.tick;
	// if(this.me){
	// 	this.me.onFlash(data);
	// }
};

GameManager.prototype.onAlert = function(data) {
	alert(data.t);
};

GameManager.prototype.update = function() {
	this.tick++;
	this.workCamera();
};

GameManager.prototype.workCamera = function() {
	if(!this.camera || !this.currentLevel){
		return;
	}

	if(this.currentLevel.levelWidth > 960){
		if(this.me){
			var targetX = -Math.min(Math.max(0, this.me.gameObject.anchoredX - 480), this.currentLevel.levelWidth - 960);
			this.camera.anchoredX = this.camera.anchoredX + (targetX - this.camera.anchoredX) * 0.08;
		}
	}else if(this.camera.anchoredX != 0){
		this.camera.anchoredX = 0;
	}

	if(this.currentLevel.levelHeight > 640){
		if(this.me){
			var targetY = Math.min(Math.max(0, -(this.me.gameObject.anchoredY) - 320), this.currentLevel.levelHeight - 640);
			this.camera.anchoredY = this.camera.anchoredY + (targetY - this.camera.anchoredY) * 0.08;
		}
	}else if(this.camera.anchoredY != 0){
		this.camera.anchoredY = 0;
	}
};

GameManager.prototype.start = function() {
	if(this.players.length > 0){
		for(var i = 0; i < this.players.length; i++){
			this.players[i].destroy();
		}
	}
	this.players = [];
	this.me = null;
	this.playerMap = {};
	TopUIManager.instance.setRoomNum(this.channel);

	this.generatePlayer(this.myName, this.myUUID, this.myScore, true, this.currentLevel.spawnPointX, this.currentLevel.spawnPointY, this.myTitle, {scored: false, infected: false});
	ScorePanelManager.instance.start(this.myName, this.myUUID, this.myScore);
};

GameManager.prototype.onKeyDown = function(keycode) {
	if(keycode == qc.Keyboard.Q){
		ScorePanelManager.instance.show();
	}else if(keycode == qc.Keyboard.F4){
		SoundManager.instance.mute = !SoundManager.instance.mute;
		if(GameManager.instance.me){
			GameManager.instance.me.showLabel(SoundManager.instance.mute ? "已关闭声音" : "已开启声音");
		}
	}
};

GameManager.prototype.onKeyUp = function(keycode) {
	if(keycode == qc.Keyboard.Q){
		ScorePanelManager.instance.hide();
	}
};

GameManager.prototype.generatePlayer = function(name, uuid, score, isMe, posX, posY, title, data) {
	if((isMe && this.me != null) || this.playerMap["p" + uuid] || uuid <= 0){
		return;
	}

	var player = this.game.add.clone(this.playerPrefab, this.map);
	player.Player.gen(name, uuid, score, isMe, posX, posY, title, data);

	for(var i = 0; i < this.currentLevel.items.length; i++){
		var stuff = this.currentLevel.items[i];
		if(stuff){
			stuff.getScript('qc.arcade.RigidBody').addCollide(player);
		}
		player.getScript('qc.arcade.RigidBody').addCollide(stuff);
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.getScript('qc.arcade.RigidBody').addCollide(player);
		}
	}

	this.players.push(player);
	TopUIManager.instance.setPlayerCount(this.players.length, (this.mode == "py" ? "-" : 16));
};

GameManager.prototype.removePlayer = function(player) {
	for(var i = 0; i < this.currentLevel.items.length; i++){
		var stuff = this.currentLevel.items[i];
		if(stuff){
			stuff.getScript('qc.arcade.RigidBody').removeCollide(player);
		}
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.getScript('qc.arcade.RigidBody').removeCollide(player);
		}
	}

	if(this.players.indexOf(player) >= 0){
		this.players.splice(this.players.indexOf(player), 1);
	}
	player.destroy();
	TopUIManager.instance.setPlayerCount(this.players.length, (this.mode == "py" ? "-" : 16));
};

GameManager.prototype.onNewPlayer = function(data){
	var name = data.name;
	var uuid = data.uuid;
	var score = data.score;
	var title = data.title;
	this.generatePlayer(name, uuid, score, false, this.currentLevel.spawnPointX, this.currentLevel.spawnPointY, title, {scored: false, infected: false});
};

GameManager.prototype.onGetPlayerData = function(data){
	for(var i = 0; i < data.length; i++){
		var d = data[i];
		var name = d.name;
		var uuid = d.uuid;
		var x = d.x;
		var y = d.y;
		var score = d.score;
		var scored = d.scored ? true : false;
		var infected = d.infected;
		var title = d.title;
		this.generatePlayer(name, uuid, score, false, x, y, title, {scored: scored, infected: infected});
	}
};

GameManager.prototype.onGetRoom = function(data){
	this.channel = data.id;
	this.mode = data.mode;
	var l = data.map;
	var t = data.time;
	this.mapData = data.data;
	GameManager.instance.myScore = 0;

	var modeName = (this.mode == "race" ? "竞速模式" : (this.mode == "plague" ? "瘟疫模式" : (this.mode == "py" ? "PY模式" : "未知模式")));
	TopUIManager.instance.setModeName(modeName);
	if(this.mode == "race"){
		if(this.levels[l-1]){
			this.currentLevel = this.levels[l-1].LevelManager;

			for(var i = 0; i < this.levels.length; i++){
				if(l-1 == i){
					this.levels[i].visible = true;
				}else{
					this.levels[i].visible = false;
				}
			}
			for(var i = 0; i < this.pLevels.length; i++){
				this.pLevels[i].visible = false;
			}
			this.pyLevel.visible = false;
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}else if(this.mode == "plague"){
		if(this.pLevels[l-1]){
			this.currentLevel = this.pLevels[l-1].PlagueLevelManager;
			for(var i = 0; i < this.pLevels.length; i++){
				if(l-1 == i){
					this.pLevels[i].visible = true;
				}else{
					this.pLevels[i].visible = false;
				}
			}
			for(var i = 0; i < this.levels.length; i++){
				this.levels[i].visible = false;
			}
			this.pyLevel.visible = false;
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}else if(this.mode == "py"){
		if(this.pyLevel){
			this.currentLevel = this.pyLevel.PYLevelManager;
			for(var i = 0; i < this.pLevels.length; i++){
				if(l-1 == i){
					this.pLevels[i].visible = false;
				}else{
					this.pLevels[i].visible = false;
				}
			}
			for(var i = 0; i < this.levels.length; i++){
				this.levels[i].visible = false;
			}
		}else{
			alert("找不到地图文件，请刷新后再试！若依旧出现此提示，请尝试清空浏览器缓存！");
			location.reload(true);
			return;
		}
	}

	this.currentLevel.init();
	TopUIManager.instance.setTime(t);
	if(this.channel != this.lastChannel){
		this.start();
	}
	this.lastChannel = this.channel;
};

GameManager.prototype.onSwitchMap = function(data){
	this.mapData = data.data;
	for(var i = 0; i < this.currentLevel.items.length; i++){
		var item = this.currentLevel.items[i];
		if(item){
			this.resetPhysics(item, false);
		}
	}

	data.id = this.channel;
	data.mode = this.mode;
	this.onGetRoom(data);

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			this.resetPhysics(p, true);
		}
	}

	for(var i = 0; i < this.currentLevel.items.length; i++){
		var item = this.currentLevel.items[i];
		if(item){
			this.resetPhysics(item, false);
		}
	}

	for(var i = 0; i < this.players.length; i++){
		var p = this.players[i];
		if(p){
			p.Player.init();

			for(var j = 0; j < this.currentLevel.items.length; j++){
				var stuff = this.currentLevel.items[j];
				if(stuff){
					stuff.getScript('qc.arcade.RigidBody').addCollide(p);
				}
				p.getScript('qc.arcade.RigidBody').addCollide(stuff);
			}

			for(var k = 0; k < this.players.length; k++){
				var pp = this.players[k];
				if(pp && p != pp){
					p.getScript('qc.arcade.RigidBody').addCollide(pp);
				}
			}

			p.anchoredX = this.currentLevel.spawnPointX;
			p.anchoredY = this.currentLevel.spawnPointY;
		}
	}
};

GameManager.prototype.resetPhysics = function(stuff, isPlayer){
	stuff.getScript('qc.arcade.RigidBody').collides.length = 0;
	// for(var j = 0; j < this.currentLevel.items.length; j++){
	// 	var item = this.currentLevel.items[j];
	// 	if(stuff != item){
	// 		stuff.getScript('qc.arcade.RigidBody').addCollide(item);
	// 	}
	// }
	//
	// for(var k = 0; k < this.players.length; k++){
	// 	var pp = this.players[k];
	// 	if(stuff != pp){
	// 		stuff.getScript('qc.arcade.RigidBody').addCollide(pp);
	// 	}
	// }
};

GameManager.prototype.getLenth = function(txt) {
    var len = 0;
    for (var i = 0; i < txt.length; i++) {
        var a = txt.charAt(i);
        if (a.match(/[^\x00-\xff]/ig) != null) {
            len += 2;
        }
        else {
            len += 1;
        }
    }
    return len;
};
