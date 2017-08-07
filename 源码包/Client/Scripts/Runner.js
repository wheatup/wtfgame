// define a user behaviour
var Runner = qc.defineBehaviour('qc.engine.Runner', qc.Behaviour, function() {
    this.startX = 0;
	this.startY = 0;
}, {
    startX: qc.Serializer.INT,
	startY: qc.Serializer.INT
});

// Called when the script instance is being loaded.
Runner.prototype.update = function() {
	this.gameObject.anchoredX = this.startX;
	this.gameObject.anchoredY = this.startY;
	// if(this.startX > this.endX){
	// 	if(this.gameObject.anchoredX <= this.endX){
	// 		this.gameObject.anchoredX = this.startX;
	// 	}
	// }else if(this.startX < this.endX){
	// 	if(this.gameObject.anchoredX >= this.endX){
	// 		this.gameObject.anchoredX = this.startX;
	// 	}
	// }
};

// Called every frame, if the behaviour is enabled.
//Runner.prototype.update = function() {
//
//};
