var Elevator = qc.defineBehaviour('qc.wtf.Elevator', qc.Behaviour, function() {
	this.isOn = false;
	this.eval = 0;
	this.rigidbody = null;

	this.onSp = new qc.Point(0, 0);
	this.offSp = new qc.Point(0, 0);
}, {
	startPos: qc.Serializer.POINT,
	endPos: qc.Serializer.POINT,
	startSpeed: qc.Serializer.NUMBER,
	endSpeed: qc.Serializer.NUMBER
});

Elevator.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
	this.onSp.x = (this.endPos.x - this.startPos.x) * this.startSpeed;
	this.onSp.y = (this.endPos.y - this.startPos.y) * this.startSpeed;
	this.offSp.x = (this.startPos.x - this.endPos.x) * this.endSpeed;
	this.offSp.y = (this.startPos.y - this.endPos.y) * this.endSpeed;
};

Elevator.prototype.turnOn = function() {
	this.isOn = true;
};

Elevator.prototype.turnOff = function() {
	this.isOn = false;
};

Elevator.prototype.update = function() {
	if(this.isOn){
		if(!this.checkReach(this.onSp, this.startPos, this.endPos)){
			this.rigidbody.velocity.x = this.onSp.x;
			this.rigidbody.velocity.y = this.onSp.y;
		}else{
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
		}
	}else{
		if(!this.checkReach(this.offSp, this.endPos, this.startPos)){
			this.rigidbody.velocity.x = this.offSp.x;
			this.rigidbody.velocity.y = this.offSp.y;
		}else{
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
		}
	}
};

Elevator.prototype.checkReach = function(vec, startPos, endPos) {
	if(vec.x != 0){
		if(vec.x < 0){
			if(this.gameObject.anchoredX <= endPos.x){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}else{
			if(this.gameObject.anchoredX >= endPos.x){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}
	}else{
		if(vec.y < 0){
			if(this.gameObject.anchoredY <= endPos.y){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}else{
			if(this.gameObject.anchoredY >= endPos.y){
				this.gameObject.anchoredX = endPos.x;
				this.gameObject.anchoredY = endPos.y;
				return true;
			}
		}
	}
	return false;
};
