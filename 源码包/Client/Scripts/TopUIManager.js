// define a user behaviour
var TopUIManager = qc.defineBehaviour('qc.wtf.TopUIManager', qc.Behaviour, function() {
	TopUIManager.instance = this;
    this.time = 0;
}, {
    lblRoomNum: qc.Serializer.NODE,
	lblPlayerCount: qc.Serializer.NODE,
	lblTimer: qc.Serializer.NODE,
	lblMapName: qc.Serializer.NODE,
	lblModeName: qc.Serializer.NODE
});

TopUIManager.prototype.awake = function() {
	this.gameObject.visible = true;
	var self = this;
	this.game.timer.loop(1000, function(){self.tick();});
};

TopUIManager.prototype.setTime = function(sec) {
	this.time = sec;
};

TopUIManager.prototype.setRoomNum = function(num) {
	this.lblRoomNum.text = ((num < 10 && num > 0) ? '0' : '') + num;
};

TopUIManager.prototype.setMapName = function(name) {
	this.lblMapName.text = name;
};

TopUIManager.prototype.setModeName = function(name) {
	this.lblModeName.text = name;
};

TopUIManager.prototype.setPlayerCount = function(count, max) {
	this.lblPlayerCount.text = '玩家:' + count + '/' + max;
};

TopUIManager.prototype.tick = function() {
	this.time--;
	if(this.time < 0) return;

	var min = Math.floor(this.time / 60);
	var sec = this.time % 60;

	this.lblTimer.text = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
};
