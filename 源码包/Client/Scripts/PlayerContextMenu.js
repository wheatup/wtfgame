// define a user behaviour
var PlayerContextMenu = qc.defineBehaviour('qc.engine.PlayerContextMenu', qc.Behaviour, function() {
	PlayerContextMenu.instance = this;
    this.uuid = 0;
	this.playerName = "Unknown";
}, {
    lblName: qc.Serializer.NODE,
	btnMute: qc.Serializer.NODE,
	btnFriend: qc.Serializer.NODE,
	btnKick: qc.Serializer.NODE,
	btnBan: qc.Serializer.NODE,
	btnTitle: qc.Serializer.NODE,
	btnClose: qc.Serializer.NODE
});

PlayerContextMenu.prototype.awake = function() {
	this.btnMute.onClick.add(this.onClickMute, this);
	this.btnFriend.onClick.add(this.onClickFriend, this);
	this.btnKick.onClick.add(this.onClickKick, this);
	this.btnBan.onClick.add(this.onClickBan, this);
	this.btnTitle.onClick.add(this.onClickTitle, this);
	this.btnClose.onClick.add(this.onClickClose, this);
	this.gameObject.visible = false;
};

PlayerContextMenu.prototype.onClickMute = function() {
	if(GameManager.instance.myUUID == this.uuid){
		GameManager.instance.me.showLabel("不能屏蔽自己");
		this.hide();
		return;
	}

	if(GameManager.instance.ignoreList.indexOf(this.uuid) >= 0){
		GameManager.instance.ignoreList.splice(GameManager.instance.ignoreList.indexOf(this.uuid), 1);
		GameManager.instance.me.showLabel("解除屏蔽了 " + this.playerName);
	}else{
		GameManager.instance.ignoreList.push(this.uuid);
		GameManager.instance.me.showLabel("屏蔽了 " + this.playerName);
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickFriend = function() {
	GameManager.instance.me.showLabel("功能尚未开放");
	this.hide();
};

PlayerContextMenu.prototype.onClickKick = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		if(confirm("是否踢出 " + this.playerName + " ？")){
			ServerManager.instance.sendMessage("kick", {"uuid": this.uuid});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickBan = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		if(confirm("是否封禁 " + this.playerName + " ？")){
			ServerManager.instance.sendMessage("ban", {"uuid": this.uuid});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickTitle = function() {
	if(!GameManager.instance.isAdmin){
		GameManager.instance.me.showLabel("权限不足");
	}else{
		var title = prompt("输入称号");
		if(title){
			ServerManager.instance.sendMessage("title", {"uuid": this.uuid, "title": title});
		}
	}
	this.hide();
};

PlayerContextMenu.prototype.onClickClose = function() {
	this.hide();
};

PlayerContextMenu.prototype.show = function(uuid, posX, posY) {
	this.gameObject.visible = true;
	this.uuid = uuid;
	var name = "Unknown";
	var p = GameManager.instance.playerMap["p" + uuid];
	if(p && p.Player){
		name = p.Player.playerName;
		this.lblName.text = name;
		this.playerName = name;
	}
	this.gameObject.anchoredX = posX;
	this.gameObject.anchoredY = posY;

	if(GameManager.instance.isAdmin){
		this.btnKick.colorTint = new qc.Color("#FFFFFF");
		this.btnBan.colorTint = new qc.Color("#FFFFFF");
		this.btnTitle.colorTint = new qc.Color("#FFFFFF");
		this.btnFriend.colorTint = new qc.Color("#AAAAAA");
	}else{
		this.btnKick.colorTint = new qc.Color("#AAAAAA");
		this.btnBan.colorTint = new qc.Color("#AAAAAA");
		this.btnTitle.colorTint = new qc.Color("#AAAAAA");
		this.btnFriend.colorTint = new qc.Color("#AAAAAA");
	}

	if(GameManager.instance.myUUID == uuid){
		this.btnMute.colorTint = new qc.Color("#AAAAAA");
	}else{
		this.btnMute.colorTint = new qc.Color("#FFFFFF");
	}
};

PlayerContextMenu.prototype.hide = function() {
	this.uuid = -1;
	this.gameObject.visible = false;
};
