// define a user behaviour
var Broadcast = qc.defineBehaviour('qc.wtf.Broadcast', qc.Behaviour, function() {
	Broadcast.instance = this;
    this.lbl = null;
}, {
    lbl: qc.Serializer.NODE
});

Broadcast.prototype.awake = function() {
	this.lbl.alpha = 0;
	wh.Event.bind('$broad', this.onBroadcast, this);
};

Broadcast.prototype.showBroadcast = function(text) {
	this.lbl.visible = true;
	wh.Tween.remove(this.lbl);
	this.lbl.alpha = 0;
	this.lbl.text = text;
	wh.Tween.get(this.lbl)
		.to({alpha:1}, 200)
		.wait(5000)
		.to({alpha:0}, 1000);
};

Broadcast.prototype.onBroadcast = function(data) {
	this.showBroadcast(data.text);
};
