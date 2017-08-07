// define a user behaviour
var FlashController = qc.defineBehaviour('qc.wtf.FlashController', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
FlashController.prototype.awake = function() {
	this.gameObject.visible = true;
	this.gameObject.alpha = 0;
	wh.Event.bind('$flash', this.onFlash, this);
};

// Called every frame, if the behaviour is enabled.
FlashController.prototype.onFlash = function() {
	SoundManager.instance.play('flash');
	wh.Tween.remove(this.gameObject);
	wh.Tween.get(this.gameObject)
		.to({alpha:0.5})
		.to({alpha:0}, 200);
};
