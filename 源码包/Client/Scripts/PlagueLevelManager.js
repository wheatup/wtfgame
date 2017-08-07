// define a user behaviour
var PlagueLevelManager = qc.defineBehaviour('qc.wtf.PlagueLevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "plague";

	this.levelName = '默认地图';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	zombieSpawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

PlagueLevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

PlagueLevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
};
