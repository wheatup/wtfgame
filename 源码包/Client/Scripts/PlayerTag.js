// define a user behaviour
var PlayerTag = qc.defineBehaviour('qc.engine.PlayerTag', qc.Behaviour, function() {
	this.playerName = "";
	this.score = 0;
	this.complete = false;
	this.uuid = -1;
	this.rank = 0;
}, {
	bg: qc.Serializer.NODE,
	nameTag: qc.Serializer.NODE,
    scoreTag: qc.Serializer.NODE
});

PlayerTag.prototype.awake = function() {
	this.bg.alpha = 0.3;
};

PlayerTag.prototype.setComplete = function(isComplete) {
	this.complete = isComplete;
	this.bg.alpha = isComplete ? 0.6 : 0.3;
};

PlayerTag.prototype.setName = function(name) {
	this.playerName = name;
	this.nameTag.text = name + "";
};

PlayerTag.prototype.setScore = function(score) {
	this.score = score;
	this.scoreTag.text = score + "";
};
