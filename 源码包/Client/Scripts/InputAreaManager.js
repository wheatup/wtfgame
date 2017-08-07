var InputAreaManager = qc.defineBehaviour('qc.wtf.InputAreaManager', qc.Behaviour, function() {
	InputAreaManager.instance = this;
	this.showing = false;
	this.nextSendTick = 0;
}, {
    inputField: qc.Serializer.NODE,
	sendButton: qc.Serializer.NODE
});

InputAreaManager.prototype.awake = function() {
	this.gameObject.visible = false;
	this.game.input.onKeyDown.add(function(keycode){
		if(keycode == qc.Keyboard.ENTER){
			this.onPressEnter();
		}
	}, this);
	this.sendButton.onClick.add(this.onPressEnter, this);
};

InputAreaManager.prototype.onPressEnter = function() {
	if(this.showing){
		if(this.inputField.text.trim().length > 0){
			this.sendMessage();
		}
		this.gameObject.visible = false;
		this.showing = false;
	}else{
		this.gameObject.visible = true;
		this.showing = true;
		this.inputField.isFocused = true;
	}
};

InputAreaManager.prototype.sendMessage = function() {
	if(GameManager.instance.tick >= this.nextSendTick){
		var msg = this.inputField.text.trim();
		msg = msg.replace(new RegExp(/(")/g),'\\"')
		ServerManager.instance.sendMessage("msg", {"msg": msg});
		this.inputField.text = "";
		this.nextSendTick = GameManager.instance.tick + 300;
	}else{
		GameManager.instance.me.showLabel("发言太快了");
	}
};
