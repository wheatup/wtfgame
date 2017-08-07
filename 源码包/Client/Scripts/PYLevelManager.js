// define a user behaviour
var PYLevelManager = qc.defineBehaviour('qc.engine.PYLevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "py";

	this.levelName = 'PY交易';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

PYLevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

PYLevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
};
