// define a user behaviour
var Button = qc.defineBehaviour('qc.wtf.Button', qc.Behaviour, function() {
    this.isOn = false;
	this.rigidbody = null;
}, {
    machines: qc.Serializer.NODES,
	machineClass: qc.Serializer.STRING
});

Button.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
};

Button.prototype.isOn = function() {
	return this.isOn;
};

Button.prototype.update = function() {
	if(this.rigidbody.touching.up && !this.isOn){
		this.turnOn();
	}else if(!this.rigidbody.touching.up && this.isOn){
		this.turnOff();
	}
	this.isOn = this.rigidbody.touching.up;
};

Button.prototype.turnOn = function() {
    SoundManager.instance.play('on');
	this.gameObject.frame = 'btn2.png';
	for(var i = 0; i < this.machines.length; i++){
		if(this.machines[i]){
			var sc = this.machines[i].getScript(this.machineClass);
			if(sc){
				sc.turnOn();
			}
		}
	}
};

Button.prototype.turnOff = function() {
    SoundManager.instance.play('off');
	this.gameObject.frame = 'btn1.png';
	for(var i = 0; i < this.machines.length; i++){
		if(this.machines[i]){
			var sc = this.machines[i].getScript(this.machineClass);
			if(sc){
				sc.turnOff();
			}
		}
	}
};
