// define a user behaviour
var ClickPanelManager = qc.defineBehaviour('qc.engine.ClickPanelManager', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
//ClickPanelManager.prototype.awake = function() {
//
//};

// Called every frame, if the behaviour is enabled.
ClickPanelManager.prototype.onClick = function(data) {
	if(!GameManager.instance.god) return;

	var x = data.source.x;
	var y = data.source.y;

	var camX = GameManager.instance.camera.anchoredX;
	var camY = GameManager.instance.camera.anchoredY;

	var calcX = x - camX;
	var calcY = -(640 - y) - camY;

	GameManager.instance.me.gameObject.anchoredX = calcX;
	GameManager.instance.me.gameObject.anchoredY = calcY;
	if(GameManager.instance.me.rigidbody){
		GameManager.instance.me.rigidbody.velocity.x = 0;
		GameManager.instance.me.rigidbody.velocity.y = 0;
	}


	GameManager.instance.me.sendMovePack('warp');
};
