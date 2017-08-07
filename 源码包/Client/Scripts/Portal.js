// define a user behaviour
var Portal = qc.defineBehaviour('qc.engine.Portal', qc.Behaviour, function() {
    this.frame = 0;
	this.tick = 0;
}, {
	image: qc.Serializer.NODE,
    dest: qc.Serializer.POINT
});

Portal.prototype.update = function() {
	this.tick++;
	if(this.tick % 6 == 0){
		this.frame = (this.frame + 1) % 4;
		this.image.frame = "portal" + (this.frame + 1) + ".png";
	}
};
