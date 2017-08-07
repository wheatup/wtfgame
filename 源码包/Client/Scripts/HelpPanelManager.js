// define a user behaviour
var HelpPanelManager = qc.defineBehaviour('qc.engine.HelpPanelManager', qc.Behaviour, function() {
    HelpPanelManager.instance = this;
}, {
    dom: qc.Serializer.NODE,
	btnOK: qc.Serializer.NODE
});

HelpPanelManager.prototype.awake = function() {
	this.btnOK.onClick.add(this.onClickOK, this);
	this.gameObject.visible = false;
};


HelpPanelManager.prototype.showHelp = function(message) {
	this.dom.innerHTML = '<textarea style="width:100%; height:100%; background-color:#346; color:#fff; text-align:center; padding:20px;font-size:16px;">' + message + '</textarea>'
	this.gameObject.visible = true;
};

// Called every frame, if the behaviour is enabled.
HelpPanelManager.prototype.onClickOK = function() {
	this.gameObject.visible = false;
};
