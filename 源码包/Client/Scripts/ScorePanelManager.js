// define a user behaviour
var ScorePanelManager = qc.defineBehaviour('qc.engine.ScorePanelManager', qc.Behaviour, function() {
    ScorePanelManager.instance = this;
	this.playerTags = [];
	this.log = "";
}, {
    playerTagPrefab: qc.Serializer.PREFAB,
	scoreView: qc.Serializer.NODE,
	dom: qc.Serializer.NODE
});

ScorePanelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	wh.Event.bind('$newplayer', this.onNewPlayer, this);
	wh.Event.bind('$playerdata', this.onGetPlayerData, this);
	wh.Event.bind('$leave', this.onLeave, this);
	wh.Event.bind('$score', this.onScore, this);
	wh.Event.bind('$newmap', this.onNewMap, this);

	wh.Event.bind('$infect', this.onInfect, this);
	wh.Event.bind('$source', this.onSource, this);
	wh.Event.bind('$fullsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 5);
		}

	}, this);

	wh.Event.bind('$sur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 3);
		}
	}, this);

	wh.Event.bind('$halfsur', function(data){
		for(var i = 0; i < data.length; i++){
			var d = data[i];
			var uuid = d.uuid;
			this.onSurvive(uuid, 1);
		}
	}, this);

	wh.Event.bind('$msg', this.onMessage, this);
};



ScorePanelManager.prototype.show = function() {
	this.gameObject.visible = true;
};

ScorePanelManager.prototype.hide = function() {
	this.gameObject.visible = false;
};

ScorePanelManager.prototype.start = function(name, uuid, score) {
	this.playerTags = [];
	this.log = "";
	this.scoreView.removeChildren();

	var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
	tag.PlayerTag.uuid = uuid;
	tag.PlayerTag.setScore(score);
	tag.PlayerTag.setName(name);
	tag.PlayerTag.setComplete(GameManager.instance.mode == "plague");

	this.playerTags.push(tag);

	this.updateOrder();
};

ScorePanelManager.prototype.onInfect = function(data) {
	var s = data.s;
	var m = data.m;

	if(s){
		for(var i = 0; i < this.playerTags.length; i++){
			var tag = this.playerTags[i];
			if(s == tag.PlayerTag.uuid){
				tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(1));
				break;
			}
		}
	}

	if(m){
		for(var i = 0; i < this.playerTags.length; i++){
			var tag = this.playerTags[i];
			if(m == tag.PlayerTag.uuid){
				tag.PlayerTag.setComplete(false);
				break;
			}
		}
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onSource = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setComplete(false);
			break;
		}
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onNewPlayer = function(data) {
	var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
	tag.PlayerTag.uuid = data.uuid;
	tag.PlayerTag.setScore(data.score);
	tag.PlayerTag.setName(data.name);
	tag.PlayerTag.setComplete(GameManager.instance.mode == "plague");

	this.addMessage("<系统>" + data.name + " 加入了房间。");

	this.playerTags.push(tag);

	this.updateOrder();
};

ScorePanelManager.prototype.onGetPlayerData = function(data) {
	for(var i = 0; i < data.length; i++){
		var d = data[i];
		var name = d.name;
		var uuid = d.uuid;
		var score = d.score;

		var tag = this.game.add.clone(this.playerTagPrefab, this.scoreView);
		tag.PlayerTag.uuid = uuid;
		tag.PlayerTag.setScore(score);
		tag.PlayerTag.setName(name);

		if(GameManager.instance.mode == "race" && d.scored){
			tag.PlayerTag.setComplete(true);
		}else if(GameManager.instance.mode == "plague" && (d.infected == 0 || d.infected == "0")){
			tag.PlayerTag.setComplete(true);
		}else{
			tag.PlayerTag.setComplete(false);
		}

		this.playerTags.push(tag);
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onLeave = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			this.playerTags.splice(i, 1);
			tag.destroy();
			break;
		}
	}
	if(GameManager.instance.playerMap["p" + data.uuid]){
		this.addMessage("<系统>" + GameManager.instance.playerMap["p" + data.uuid].Player.playerName + " 离开了房间。");
	}
	this.updateOrder();
};

ScorePanelManager.prototype.onSurvive = function(uuid, score) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(score));
			tag.PlayerTag.rank = score;
			break;
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onScore = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		if(data.uuid == tag.PlayerTag.uuid){
			tag.PlayerTag.setScore(parseInt(tag.PlayerTag.score) + parseInt(data.score));
			tag.PlayerTag.rank = data.score;
			tag.PlayerTag.setComplete(true);
			break;
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onNewMap = function(data) {
	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		tag.PlayerTag.rank = 0;
		if(GameManager.instance.mode == "plague"){
			tag.PlayerTag.setComplete(true);
		}else{
			tag.PlayerTag.setComplete(false);
		}
	}

	this.updateOrder();
};

ScorePanelManager.prototype.onMessage = function(data) {
	var text = data.msg;

	var name = "herobrine";
	if(GameManager.instance.playerMap["p" + data.uuid]){
		name = GameManager.instance.playerMap["p" + data.uuid].Player.playerName;
	}
	var t = name + ": " + text;
	this.addMessage(t);
};

ScorePanelManager.prototype.addMessage = function(message) {
	this.log = message + "\n" + this.log;
	this.dom.innerHTML = '<textarea style="width:100%; height:100%; background-color:#346; color:#fff;">' + this.log + '</textarea>';
};

ScorePanelManager.prototype.updateOrder = function() {


	this.playerTags.sort(function(a,b){
		var result = 0;

		if(a.PlayerTag.rank > 0 && b.PlayerTag.rank > 0){
			if(a.PlayerTag.rank > b.PlayerTag.rank){
				result = -1;
			}else{
				result = 1;
			}
		}else if(a.PlayerTag.rank > 0 && b.PlayerTag.rank == 0){
			result = -1;
		}else if(a.PlayerTag.rank == 0 && b.PlayerTag.rank > 0){
			result = 1;
		}else{
			if(a.PlayerTag.score > b.PlayerTag.score){
				result = -1;
			}else if(a.PlayerTag.score < b.PlayerTag.score){
				result = 1;
			}else{
				result = 0;
			}
		}
		return result;
	});

	for(var i = 0; i < this.playerTags.length; i++){
		var tag = this.playerTags[i];
		tag.anchoredY = 50 * i;
	}

	this.scoreView.height = this.playerTags.length * 50;
};
