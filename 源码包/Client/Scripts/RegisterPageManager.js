// define a user behaviour
var RegisterPageManager = qc.defineBehaviour('qc.engine.RegisterPageManager', qc.Behaviour, function() {
    RegisterPageManager.instance = this;
}, {
    inpUsername: qc.Serializer.NODE,
    inpPassword: qc.Serializer.NODE,
    inpConfirmPassword: qc.Serializer.NODE,
    inpEmial: qc.Serializer.NODE,
    inpInv: qc.Serializer.NODE,
    btnBack: qc.Serializer.NODE,
    btnRegister: qc.Serializer.NODE
});

RegisterPageManager.prototype.awake = function() {
    this.gameObject.visible = false;
};

RegisterPageManager.prototype.bindEvents = function() {
    this.btnBack.onClick.add(this.onClickBack, this);
    this.btnRegister.onClick.add(this.onClickRegister, this);
    wh.Event.bind("$outdate", this.onOutDate, this);
    wh.Event.bind("$nametaken", this.onNameTaken, this);
    wh.Event.bind("$emailtaken", this.onEmailTaken, this);
    wh.Event.bind("$inhibit", this.onInhibit, this);
    wh.Event.bind("$fail", this.onFail, this);
    wh.Event.bind("$success", this.onSuccess, this);
    wh.Event.bind("$wronginv", this.onWrongInv, this);
};

RegisterPageManager.prototype.unbindEvents = function() {
    this.btnBack.onClick.remove(this.onClickBack, this);
    this.btnRegister.onClick.remove(this.onClickRegister, this);
    wh.Event.unbind("$outdate", this.onOutDate);
    wh.Event.unbind("$nametaken", this.onNameTaken);
    wh.Event.unbind("$emailtaken", this.onEmailTaken);
    wh.Event.unbind("$inhibit", this.onInhibit);
    wh.Event.unbind("$fail", this.onFail);
    wh.Event.unbind("$success", this.onSuccess);
    wh.Event.unbind("$wronginv", this.onWrongInv);
};

RegisterPageManager.prototype.onClickRegister = function() {
    var username = this.inpUsername.text.trim();
    var password1 = this.inpPassword.text;
    var password2 = this.inpConfirmPassword.text;
    var email = this.inpEmial.text.trim();
    var invCode = this.inpInv.text.trim();

    if(this.getLenth(username) <= 0){
        alert("用户名不能为空！");
        return;
    }

    if(this.getLenth(username) > 20){
        alert("用户名太长(最长20字符，汉字占2字符)！");
        return;
    }

    if(email.length == 0){
        alert("邮箱不能为空！");
        return;
    }

    var szReg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    var bChk = szReg.test(email);
    if(!bChk){
        alert("邮箱格式错误！");
        return;
    }

    if(password1.length == 0){
        alert("密码不能为空！");
        return;
    }

    if(password1 != password2){
        alert("两次密码输入不一致！");
        return;
    }

    ServerManager.instance.sendMessage("register", {
        username: username,
        password: password1,
        email: email,
        invCode: (invCode ? invCode : ""),
        version: GameManager.instance.version
    });
};

RegisterPageManager.prototype.onWrongInv = function() {
    alert("授权码有误，请重试！");
};

RegisterPageManager.prototype.onNameTaken = function() {
    alert("用户名已被占用！");
};

RegisterPageManager.prototype.onOutDate = function() {
    alert("您的游戏版本过旧，请刷新后重试！如果还出现此提示请清空浏览器缓存后再试！");
	ServerManager.instance.close();
};

RegisterPageManager.prototype.onEmailTaken = function() {
    alert("邮箱已被占用！");
};

RegisterPageManager.prototype.onInhibit = function() {
    alert("目前无法注册新账号，很抱歉！");
};

RegisterPageManager.prototype.onFail = function() {
    alert("注册失败！");
};

RegisterPageManager.prototype.onSuccess = function() {
    alert("注册成功！");
    this.close();
    LoginManager.instance.gameObject.visible = true;
};

RegisterPageManager.prototype.onClickBack = function() {
    this.close();
    LoginManager.instance.gameObject.visible = true;
};

RegisterPageManager.prototype.start = function() {
    this.gameObject.visible = true;
    this.bindEvents();
};

RegisterPageManager.prototype.close = function() {
    this.inpUsername.txt = "";
    this.inpPassword.txt = "";
    this.inpConfirmPassword.txt = "";
    this.inpEmial.txt = "";
    this.inpInv.txt = "";
    this.gameObject.visible = false;
    this.unbindEvents();
};

RegisterPageManager.prototype.getLenth = function(txt) {
    var len = 0;
    for (var i = 0; i < txt.length; i++) {
        var a = txt.charAt(i);
        if (a.match(/[^\x00-\xff]/ig) != null) {
            len += 2;
        }
        else {
            len += 1;
        }
    }
    return len;
};
