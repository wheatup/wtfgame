// define a user behaviour
var LoginManager = qc.defineBehaviour('qc.wtf.LoginManager', qc.Behaviour, function() {
    LoginManager.instance = this;
    this.username = 'Player';
    this.connected = false;
}, {
    inpUsername: qc.Serializer.NODE,
	btnStart: qc.Serializer.NODE,
	tip: qc.Serializer.NODE,
	dropdown: qc.Serializer.NODE
});

LoginManager.prototype.awake = function() {
	this.gameObject.visible = true;
	this.hideTip();
	this.btnStart.onClick.add(this.onClickStart, this);

    this.showTip('正在连接服务器...');
    wh.Event.bind('ON_OPEN', this.onOpen, this);
    wh.Event.bind('$outdate', this.onOutDate, this);
    wh.Event.bind('$login', this.onLogin, this);
    wh.Event.bind('$full', this.onFull, this);
    wh.Event.bind('$occupy', this.onOccupy, this);
    wh.Event.bind('$shutdown', this.onShutdown, this);
    ServerManager.instance.connect();
    if(this.dropdown.value < 0 || this.dropdown.value > 2){
		this.dropdown.value = 0;
	}
};

LoginManager.prototype.hide = function() {
	this.gameObject.visible = false;
};

LoginManager.prototype.onClickRegister = function() {
    if(!this.connected) return;
    this.gameObject.visible = false;
    RegisterPageManager.instance.start();
};

LoginManager.prototype.onClickStart = function() {
    if(!this.connected) return;

	var username = this.inpUsername.text.trim();
	if(GameManager.instance.getLenth(username.trim()) == 0){
		this.showTip('请输入用户名！');
		return;
	}
    if(GameManager.instance.getLenth(username.trim()) > 20){
		this.showTip('用户名太长！');
		return;
	}
	if(this.dropdown.value < 0 || this.dropdown.value > 2){
		this.dropdown.value = 0;
	}

	this.username = username;

    var pack = {
		name: this.username,
		ver: GameManager.instance.version,
		mode: this.dropdown.value
	};

    this.game.storage.set('username', username);

	ServerManager.instance.sendMessage('login', pack);
};

LoginManager.prototype.onOpen = function() {
    this.connected = true;
    this.showTip('');

    var storedName = this.game.storage.get('username');
    if(storedName != null && storedName != ''){
        this.inpUsername.text = storedName;
        this.inpUsername.placeholder.text = "";
    }
};

LoginManager.prototype.onLogin = function(data) {
	this.hide();
	GameManager.instance.myName = data.name;
	GameManager.instance.myUUID = data.uuid;
	GameManager.instance.myTitle = data.title;
    GameManager.instance.myScore = data.score;
	GameManager.instance.gameObject.visible = true;

    this.game.storage.save();
	var text = "**如游戏出错请清空浏览器缓存**\n\n====== 操作说明 ======\n\n方向键移动，空格键互动，Q键查看得分榜与聊天日志，F4键静音/取消静音。\n\n\n====== 竞速模式 ======\n\n• 玩家的目标是从出生点走到终点旗帜。\n\n• 每隔3-5秒屏幕会闪一次红光，在闪红光之前按方向键下键（趴下）即可存活。\n\n\n====== 瘟疫模式 ======\n\n• 游戏会随机选择一名玩家为感染源。\n\n• 瘟疫玩家投掷健康玩家可以感染玩家，每感染一个玩家获得1分，被感染的玩家需要继续感染健康玩家。\n\n• 非感染源瘟疫玩家将获得减速和投掷CD加长的debuff。\n\n• 存活到最后的玩家将获得大量分数。\n\n\n====== 更新日志 ======\n\nver0.5.0\n\n去除注册用户功能。\n\n\n====== 玩家反馈 ======\n\n如有建议或意见，请加QQ群224883545。";
	HelpPanelManager.instance.showHelp(text);
};

LoginManager.prototype.onOutDate = function(data) {
	alert("您的游戏版本过旧，请刷新后重试！如果还出现此提示请清空浏览器缓存后再试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onOccupy = function(data) {
	alert("已经有相同名字的玩家在线了，换个名字试试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onFull = function(data) {
	alert("服务器已满，请稍候再试！");
	ServerManager.instance.close();
};

LoginManager.prototype.onShutdown = function(data) {
	alert("服务器已关闭！");
	ServerManager.instance.close();
};

LoginManager.prototype.showTip = function(tip) {
	this.tip.visible = true;
	this.tip.text = tip;
};

LoginManager.prototype.hideTip = function() {
	this.tip.visible = false;
};
