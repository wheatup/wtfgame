var Turret = qc.defineBehaviour('qc.wtf.Turret', qc.Behaviour, function() {
	this.delay = 0;
	this.isAuto = false;
	this.autoFreq = 10;
	this.tick = 0;
	this.distance = 100;
}, {
	delay: qc.Serializer.NUMBER,
	dir: qc.Serializer.POINT,
    bulletPrefab: qc.Serializer.PREFAB,
	isAuto: qc.Serializer.BOOLEAN,
	autoFreq: qc.Serializer.INT,
	distance: qc.Serializer.INT
});

Turret.prototype.update = function() {
	this.tick++;
	if(this.isAuto){
		if(this.tick % this.autoFreq == 0){
			this.shoot();
		}
	}
};

Turret.prototype.shoot = function() {
	SoundManager.instance.play('shoot');
	var b = this.game.add.clone(this.bulletPrefab, this.gameObject.parent);
	b.Bullet.gen(new qc.Point(this.gameObject.anchoredX, this.gameObject.anchoredY), this.dir, this.distance);
};

Turret.prototype.awake = function() {
	if(!this.isAuto){
		wh.Event.bind('$shoot', this.onShoot, this);
	}
};

Turret.prototype.onShoot = function(data) {
	var self = this;
	this.game.timer.add(this.delay, function(){
		if(self.gameObject.isWorldVisible()){
			self.shoot();
		}
	});
};
