// define a user behaviour
var ScoreLabel = qc.defineBehaviour('qc.wtf.ScoreLabel', qc.Behaviour, function() {
	this.tick = 0;
}, {
	label: qc.Serializer.NODE
});

ScoreLabel.prototype.init = function(score) {
	this.label.text = score + "";
};

ScoreLabel.prototype.update = function() {
	this.tick++;
	if(this.tick < 50){
		return;
	}

	this.gameObject.anchoredY -= 1;
	this.gameObject.alpha -= 0.05;
	if(this.gameObject.alpha < 0){
		this.gameObject.alpha = 0;
	}
	if(this.tick >= 70){
		this.gameObject.destroy();
	}
};
