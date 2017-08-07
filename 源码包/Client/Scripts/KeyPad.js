// define a user behaviour
var KeyPad = qc.defineBehaviour('qc.engine.KeyPad', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    btnLeft: qc.Serializer.NODE,
	btnRight: qc.Serializer.NODE,
	btnDown: qc.Serializer.NODE,
	btnJump: qc.Serializer.NODE,
	btnAct: qc.Serializer.NODE,
	btnChat: qc.Serializer.NODE,
	btnRank: qc.Serializer.NODE
});

// Called when the script instance is being loaded.
KeyPad.prototype.awake = function() {
	if(!this.game.device.desktop){
		this.gameObject.visible = true;
		this.btnLeft.onDown.add(this.onLeftDown, this);
		this.btnLeft.onUp.add(this.onLeftUp, this);
		this.btnRight.onDown.add(this.onRightDown, this);
		this.btnRight.onUp.add(this.onRightUp, this);
		this.btnDown.onDown.add(this.onDownDown, this);
		this.btnDown.onUp.add(this.onDownUp, this);
		this.btnJump.onDown.add(this.onJumpDown, this);
		this.btnJump.onUp.add(this.onJumpUp, this);
		this.btnAct.onDown.add(this.onActDown, this);
		this.btnAct.onUp.add(this.onActUp, this);
		this.btnChat.onClick.add(this.onChatClick, this);
		this.btnRank.onDown.add(this.onRankDown, this);
		this.btnRank.onUp.add(this.onRankUp, this);
	}else{
		this.gameObject.visible = false;
	}
};

KeyPad.prototype.onLeftDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isLeftDown = true;
	GameManager.instance.me.isLeftJustDown = true;
};

KeyPad.prototype.onLeftUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isLeftDown = false;
	GameManager.instance.me.isLeftJustUp = true;
};

KeyPad.prototype.onRightDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isRightDown = true;
	GameManager.instance.me.isRightJustDown = true;
};

KeyPad.prototype.onRightUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isRightDown = false;
	GameManager.instance.me.isRightJustUp = true;
};

KeyPad.prototype.onDownDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isDownDown = true;
	GameManager.instance.me.isDownJustDown = true;
};

KeyPad.prototype.onDownUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isDownDown = false;
	GameManager.instance.me.isDownJustUp = true;
};

KeyPad.prototype.onJumpDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isUpDown = true;
	GameManager.instance.me.isUpJustDown = true;
};

KeyPad.prototype.onJumpUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isUpDown = false;
	GameManager.instance.me.isUpJustUp = true;
};

KeyPad.prototype.onActDown = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isSpaceDown = true;
	GameManager.instance.me.isSpaceJustDown = true;
};

KeyPad.prototype.onActUp = function() {
	if(!GameManager.instance.me) return;
	GameManager.instance.me.isSpaceDown = false;
	GameManager.instance.me.isSpaceJustUp = true;
};

KeyPad.prototype.onChatClick = function() {
	InputAreaManager.instance.onPressEnter();
};

KeyPad.prototype.onRankDown = function() {
	ScorePanelManager.instance.show();
};

KeyPad.prototype.onRankUp = function() {
	ScorePanelManager.instance.hide();
};
