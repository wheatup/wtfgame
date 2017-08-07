// define a user behaviour
var Bullet = qc.defineBehaviour('qc.wtf.Bullet', qc.Behaviour, function() {
    this.speed = null;
	this.destroyDistance = 100;
	this.startPos = null;
}, {

});

Bullet.prototype.gen = function(position, speed, destroyDistance) {
	this.destroyDistance = destroyDistance;
	this.gameObject.anchoredX = position.x;
	this.gameObject.anchoredY = position.y;
	this.startPos = new qc.Point(position.x, position.y);
	this.speed = speed;
	wh.Event.bindOnce('$newmap', this.onSwitchMap, this);
};

Bullet.prototype.update = function() {
	if(!this.gameObject) return;

	if(this.speed){
		this.gameObject.anchoredX += this.speed.x;
		this.gameObject.anchoredY += this.speed.y;
		var dist = Math.sqrt(Math.pow(this.gameObject.anchoredX - this.startPos.x, 2) + Math.pow(this.gameObject.anchoredY - this.startPos.y, 2));
		if(dist >= this.destroyDistance){
			this.gameObject.destroy();
		}
	}

	if(GameManager.instance.me){
		var dist = Math.sqrt(Math.pow(this.gameObject.anchoredX - GameManager.instance.me.gameObject.anchoredX, 2) + Math.pow(this.gameObject.anchoredY - (GameManager.instance.me.gameObject.anchoredY - 16), 2));
		if(dist < 20){
			GameManager.instance.me.kill();
		}
	}


};

Bullet.prototype.onSwitchMap = function() {
	if(this.gameObject){
		this.gameObject.destroy();
	}
};
