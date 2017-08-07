// define a user behaviour
var LevelManager = qc.defineBehaviour('qc.wtf.LevelManager', qc.Behaviour, function() {
	this.spawnPointX = 0;
	this.spawnPointY = 0;
	this.modeName = "race";

	this.levelName = '默认地图';
	this.levelWidth = 960;
	this.levelHeight = 640;
}, {
    spawnPoint: qc.Serializer.NODE,
	items: qc.Serializer.NODES,
	portals: qc.Serializer.NODES,
	safeZones: qc.Serializer.NODES,
	flag: qc.Serializer.NODE,
	levelName: qc.Serializer.STRING,
	levelWidth: qc.Serializer.NUMBER,
	levelHeight: qc.Serializer.NUMBER
});

LevelManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.spawnPointX = this.spawnPoint.anchoredX;
	this.spawnPointY = this.spawnPoint.anchoredY;
};

LevelManager.prototype.init = function() {
	this.gameObject.visible = true;
	TopUIManager.instance.setMapName(this.levelName);
	if(this.levelName == "竞速14"){
		var num = GameManager.instance.mapData;
		//console.log("第" + (num+1) + "个传送门好像有点不一样，去看一看！");
		console.log("F12也帮不了你了");
		if(this.portals[num + 1]){
			this.portals[num + 1].Portal.dest = new qc.Point(480, -360);
		}
	}
};

//LevelManager.prototype.update = function() {
//
//};
