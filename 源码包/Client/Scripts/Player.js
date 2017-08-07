var Player = qc.defineBehaviour('qc.wtf.Player', qc.Behaviour, function() {
    this.isMe = true;
	this.controlable = true;
	this.jumping = false;
	this.moveSpeed = 200;
	this.jumpSpeed = 500;
	this.throwHeight = 360;
	this.throwSpeed = 240;
	this.playerName = 'Player';
	this.friction = 100;
	this.uuid = -1;
	this.isFacingLeft = true;
	this.touchedFlag = false;
	this.score = 0;

	this.tick = 0;


	this.state = 0;
	this.initPickTimer = 10;
	this.initThrowTimer = 180;

	this.pickCoolDown = 30;

	this.pickTimer = 0;
	this.nextPickTime = 0;

	this.throwTimer = 0;
	this.speedMagnifer = 1;

	this.curAnimation = '';
	this.rigidbody = null;
	this.lastTouchGround = false;
	this.targetSpeedX = 0;
	this.targetSpeedY = 0;
	this.isLeftDown = false;
	this.isLeftJustDown = false;
	this.isLeftJustUp = false;
	this.isRightDown = false;
	this.isRightJustDown = false;
	this.isRightJustUp = false;
	this.isUpDown = false;
	this.isUpJustDown = false;
	this.isUpJustUp = false;
	this.isDownDown = false;
	this.isDownJustDown = false;
	this.isDownJustUp = false;
	this.isSpaceJustDown = false;
	this.isSpaceDown = false;
	this.isSpaceJustUp = false;
	this.isControlJustBack = false;
}, {
	isMe: qc.Serializer.BOOLEAN,
	moveSpeed: qc.Serializer.NUMBER,
	jumpSpeed: qc.Serializer.NUMBER,
	friction: qc.Serializer.NUMBER,
	playerName: qc.Serializer.STRING,

	playerImage: qc.Serializer.NODE,
	nameTag: qc.Serializer.NODE,
	bubble: qc.Serializer.NODE,
	title: qc.Serializer.NODE,
	scoreLabel: qc.Serializer.PREFAB
});

Player.prototype.preUpdate = function() {
	this.isLeftJustDown = false;
	this.isLeftJustUp = false;
	this.isRightJustDown = false;
	this.isRightJustUp = false;
	this.isUpJustDown = false;
	this.isUpJustUp = false;
	this.isDownJustDown = false;
	this.isDownJustUp = false;
	this.isSpaceJustDown = false;
	this.isSpaceJustUp = false;
	this.isControlJustBack = false;
};

Player.prototype.awake = function() {
	this.rigidbody = this.gameObject.getScript('qc.arcade.RigidBody');
};

Player.prototype.onClick = function() {
	PlayerContextMenu.instance.show(this.uuid, this.gameObject.anchoredX + GameManager.instance.camera.anchoredX, this.gameObject.anchoredY + GameManager.instance.camera.anchoredY);
};

Player.prototype.init = function() {
	this.touchedFlag = false;
	this.gameObject.phaser.body.enable = true;
	this.playerImage.visible = true;
	this.nameTag.visible = true;
	this.title.visible = true;
	this.playerImage.colorTint = new qc.Color("#FFFFFF");
	this.speedMagnifer = 1;
	this.pickCoolDown = 30;
	//this.gameObject.alpha = 1;
};

Player.prototype.setTitle = function(title) {
	if(title == "管理员"){
		this.title.text = "<管理员>";
		this.title.color = new qc.Color('#B300FF');
		this.title.visible = true;
	}else if(title == "作者"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#10C200');
		this.title.visible = true;
	}else if(title == "赞助者"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#00C2B5');
		this.title.visible = true;
	}else if(title == "元老"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#1947FF');
		this.title.visible = true;
	}else if(title == "咸鱼王"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#9619FF');
		this.title.visible = true;
	}else if(title == "传说"){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color('#FF1919');
		this.title.visible = true;
	}else if(title != null && title != "null" && title != "" && title != " "){
		this.title.text = "<" + title + ">";
		this.title.color = new qc.Color("#FFB663");
		this.title.visible = true;
	}else{
		this.title.text = "";
	}
};

Player.prototype.gen = function(name, uuid, score, isMe, posX, posY, title, datas) {

	GameManager.instance.playerMap["p" + uuid] = this.gameObject;

	if(isMe){
		GameManager.instance.me = this;
		this.nameTag.color = new qc.Color('#FFDC00');
		Player.me = this;
		if(title == "管理员"){
			GameManager.instance.isAdmin = true;
			GameManager.instance.me.showLabel("已获取管理员权限");
		}
	}
	this.setTitle(title);

	this.nameTag.text = name;
	this.gameObject.name = name;
	this.uuid = uuid;
	this.isMe = isMe;
	this.score = score;
	this.playerName = name;
	this.gameObject.anchoredX = posX;
	this.gameObject.anchoredY = posY;

	this.init();

	if(this.isMe){
		this.game.input.onKeyDown.add(this.onKeyDown, this);
		this.game.input.onKeyUp.add(this.onKeyUp, this);
	}

	if(GameManager.instance.mode == "race"){
		if(datas.scored){
			this.touchedFlag = true;
			this.onConfirmTouchFlag();
		}
	}else if(GameManager.instance.mode == "plague"){
		if(datas.infected == 1){
			this.infect(false, false);
		}else if(datas.infected == 2){
			this.infect(true, false);
		}
	}
};

Player.prototype.onKeyDown = function(keycode) {
	switch(keycode){
		case qc.Keyboard.LEFT:
			this.isLeftDown = true;
			this.isLeftJustDown = true;
			break;
		case qc.Keyboard.RIGHT:
			this.isRightDown = true;
			this.isRightJustDown = true;
			break;
		case qc.Keyboard.UP:
			this.isUpDown = true;
			this.isUpJustDown = true;
			break;
		case qc.Keyboard.DOWN:
			this.isDownDown = true;
			this.isDownJustDown = true;
			break;
		case qc.Keyboard.SPACEBAR:
			this.isSpaceDown = true;
			this.isSpaceJustDown = true;
            break;
	}
};

Player.prototype.onKeyUp = function(keycode) {
	switch(keycode){
		case qc.Keyboard.LEFT:
			this.isLeftDown = false;
			this.isLeftJustUp = true;
			break;
		case qc.Keyboard.RIGHT:
			this.isRightDown = false;
			this.isRightJustUp = true;
			break;
		case qc.Keyboard.UP:
			this.isUpDown = false;
			this.isUpJustUp = true;
			break;
		case qc.Keyboard.DOWN:
			this.isDownDown = false;
			this.isDownJustUp = true;
			break;
		case qc.Keyboard.SPACEBAR:
			this.isSpaceDown = false;
			this.isSpaceJustUp = true;
			break;
	}
};

Player.prototype.update = function(isLeft) {
	this.tick++;

	if(!this.lastTouchGround && this.rigidbody.touching.down){
		this.onTouchGround();
	}

	if(this.isMe && this.controlable && !this.touchedFlag){
		this.checkMove();
	}

	if(this.rigidbody && this.state != 0 && this.state != 2 && this.controlable){
		this.rigidbody.velocity.x = this.targetSpeedX * this.speedMagnifer;
	}

	if(this.rigidbody && this.rigidbody.touching.down){
		this.rigidbody.drag.x = this.friction;
	}else{
		this.rigidbody.drag.x = 0;
	}

	this.pickTimer--;
	this.throwTimer--;
	this.calcAnim();
	if(this.isMe){
		if(GameManager.instance.mode == "race"){
			this.checkFlag();
			this.checkFlash();
		}

		this.checkPortal();
		this.checkFall();
	}
	this.lastTouchGround = this.rigidbody.touching.down;
};

Player.prototype.infect = function(isSource, teleport){
    SoundManager.instance.play('transform');
	if(isSource){
		var text = this.isMe ? "您是感染源，快去感染其他玩家！" : this.playerName + " 是感染源，远离他！";
		Broadcast.instance.showBroadcast(text);
		if(teleport){
			this.rigidbody.velocity.x = 0;
			this.rigidbody.velocity.y = 0;
			this.gameObject.anchoredX = GameManager.instance.currentLevel.zombieSpawnPoint.anchoredX;
			this.gameObject.anchoredY = GameManager.instance.currentLevel.zombieSpawnPoint.anchoredY;
		}
		this.playerImage.colorTint = new qc.Color("#00732E");
	}else{
		this.speedMagnifer = 0.75;
		this.pickCoolDown = 60;
		this.playerImage.colorTint = new qc.Color("#00FF91");
	}

};

Player.prototype.infectOther = function(){
	this.showLabel("+1");
};

Player.prototype.checkFall = function(){
	if(this.touchedFlag) return;
	if(this.gameObject.anchoredY > 100){
		this.flashed();
	}
};

Player.prototype.checkFlag = function(){
	if(this.touchedFlag) return;
	if(this.gameObject &&
		this.gameObject.anchoredX <= GameManager.instance.currentLevel.flag.anchoredX + 16 &&
		this.gameObject.anchoredX >= GameManager.instance.currentLevel.flag.anchoredX - 16 &&
		this.gameObject.anchoredY <= GameManager.instance.currentLevel.flag.anchoredY + 32 &&
		this.gameObject.anchoredY >= GameManager.instance.currentLevel.flag.anchoredY - 72
	){
		this.touchFlag();
	}
};

Player.prototype.checkPortal = function(){
	if(GameManager.instance.currentLevel.portals){
		if(GameManager.instance.currentLevel.portals.length > 0){
			for(var i = 0; i < GameManager.instance.currentLevel.portals.length; i++){
				if(this.gameObject &&
					this.gameObject.anchoredX <= GameManager.instance.currentLevel.portals[i].anchoredX + 16 &&
					this.gameObject.anchoredX >= GameManager.instance.currentLevel.portals[i].anchoredX - 16 &&
					this.gameObject.anchoredY <= GameManager.instance.currentLevel.portals[i].anchoredY + 32 &&
					this.gameObject.anchoredY >= GameManager.instance.currentLevel.portals[i].anchoredY - 32
				){
					this.touchPortal(GameManager.instance.currentLevel.portals[i]);
					break;
				}
			}
		}
	}
};

Player.prototype.checkMove = function(){
	if(this.isControlJustBack){
		if(this.isLeftDown){
			this.move(true);
		}else if(this.isRightDown){
			this.move(false);
		}else if(this.isDownDown){
			this.dock();
		}
	}

	if(this.isDownJustUp){
		if(this.isLeftDown){
			this.move(true);
		}else if(this.isRightDown){
			this.move(false);
		}else{
			this.stop();
		}
	}

	if(this.isSpaceJustDown && this.state != 2 && this.nextPickTime <= this.tick){
		this.pick();
	}

	if(this.isLeftJustDown){
		if(!this.isDownDown && !this.isRightDown){
			this.move(true);
			return;
		}
	}

	if(this.isRightJustDown){
		if(!this.isDownDown && !this.isLeftDown){
			this.move(false);
			return;
		}
	}

	if(this.isLeftJustUp){
		if(this.isRightDown){
			this.move(false);
		}else if(!this.isDownDown){
			this.stop();
		}
		return;
	}

	if(this.isRightJustUp){
		if(this.isLeftDown){
			this.move(true);
		}else if(!this.isDownDown){
			this.stop();
		}
		return;
	}

	if(this.isDownJustDown){
		if(this.rigidbody.touching.down){
			this.dock();
		}
		return;
	}

	if(this.isUpDown && !this.isDownDown){
		if(this.rigidbody.touching.down){
			this.jump();
			return;
		}
	}

	if(this.isDownDown){
		if(this.rigidbody.touching.down && this.state != 2){
			this.dock();
			return;
		}
	}
};


Player.prototype.calcAnim = function(){
	if(this.throwTimer > 160){
		if(this.curAnimation != 'LIFT'){
			this.playerImage.playAnimation('lift');
			this.curAnimation = 'LIFT';
		}
	}else if(this.pickTimer > 0){
		if(this.curAnimation != 'PICK'){
			this.playerImage.playAnimation('pick');
			this.curAnimation = 'PICK';
		}
	}else{
		if(this.rigidbody && this.rigidbody.touching.down){
			if(this.state == 0 && this.curAnimation != 'STAND'){
				this.playerImage.playAnimation('stand');
				this.curAnimation = 'STAND';
			}else if(this.state == 1 && this.curAnimation != 'WALK'){
				this.playerImage.playAnimation('walk');
				this.curAnimation = 'WALK';
			}else if(this.state == 2 && this.curAnimation != 'DOCK'){
				this.playerImage.playAnimation('dock');
				this.curAnimation = 'DOCK';
			}
		}else if(this.curAnimation != 'SPIN'){
			this.playerImage.playAnimation('spin');
			this.curAnimation = 'SPIN';
		}
	}
};

Player.prototype.move = function(isLeft) {
	this.targetSpeedX = (isLeft ? -this.moveSpeed : this.moveSpeed);
	this.isFacingLeft = isLeft;
	this.playerImage.scaleX = (isLeft ? 1 : -1);
	this.state = 1;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:36}, 100, Phaser.Easing.Linear.None, true);
	if(this.isMe){
		this.sendMovePack(isLeft ? 'moveLeft' : 'moveRight');
	}
};

Player.prototype.stop = function() {
	this.targetSpeedX = 0;
	this.state = 0;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:36}, 100, Phaser.Easing.Linear.None, true);

	if(this.rigidbody)
		this.rigidbody.velocity.x = this.targetSpeedX;
	if(this.isMe){
		this.sendMovePack('stop');
	}
};

Player.prototype.dock = function() {
	this.targetSpeedX = 0;
	this.state = 2;
	this.game.phaser.add.tween(this.gameObject.phaser.body).to({height:20}, 100, Phaser.Easing.Linear.None, true);
	if(this.isMe){
		this.sendMovePack('dock');
	}
};

Player.prototype.kill = function() {
	this.gameObject.anchoredX = GameManager.instance.currentLevel.spawnPoint.anchoredX;
	this.gameObject.anchoredY = GameManager.instance.currentLevel.spawnPoint.anchoredY;
	if(this.isMe){
		this.sendMovePack('kill');
        SoundManager.instance.play('die');
	}
};

Player.prototype.jump = function() {
	if(this.rigidbody)
		this.rigidbody.velocity.y = -this.jumpSpeed;
	if(this.isMe){
		this.sendMovePack('jump');
        SoundManager.instance.play('jump');
	}
};

Player.prototype.pick = function() {
	this.pickTimer = this.initPickTimer;
	if(this.isMe){
		this.nextPickTime = this.tick + this.pickCoolDown;

		var hasTarget = false;

		for(var i = 0; i < GameManager.instance.players.length; i++){
			var p = GameManager.instance.players[i];
			if(p){
				if(p == this.gameObject){
					continue;
				}

				if(this.isFacingLeft){
					if(p.anchoredX >= this.gameObject.anchoredX - 60 &&
						p.anchoredX < this.gameObject.anchoredX &&
						p.anchoredY <= this.gameObject.anchoredY + 30 &&
						p.anchoredY >= this.gameObject.anchoredY - 10
					){
						hasTarget = true;
						this.throw(p);
					}
				}else{
					if(p.anchoredX <= this.gameObject.anchoredX + 60 &&
						p.anchoredX > this.gameObject.anchoredX &&
						p.anchoredY <= this.gameObject.anchoredY + 30 &&
						p.anchoredY >= this.gameObject.anchoredY - 10
					){
						hasTarget = true;
						this.throw(p);
					}
				}
			}
		}

		if(!hasTarget){
			this.sendMovePack('pick');
		}
	}
};

Player.prototype.throw = function(p){
	this.throwTimer = this.initThrowTimer;
	if(this.isMe){
		this.sendThrowPack(p);
        SoundManager.instance.play('throw');
	}
};

Player.prototype.flashed = function() {
	if(this.gameObject){
		this.gameObject.anchoredX = GameManager.instance.currentLevel.spawnPoint.anchoredX;
		this.gameObject.anchoredY = GameManager.instance.currentLevel.spawnPoint.anchoredY;
		this.rigidbody.velocity.x = 0;
		this.rigidbody.velocity.y = 0;
	}
	if(this.isMe){
		this.sendMovePack('flashed');
        SoundManager.instance.play('die');
	}
};

Player.prototype.onWarp = function() {
	if(this.gameObject){
		this.rigidbody.velocity.x = 0;
		this.rigidbody.velocity.y = 0;
	}
};

Player.prototype.touchFlag = function(){
	this.touchedFlag = true;
	if(this.isMe){
		this.sendMovePack('flag');

	}
};

Player.prototype.touchPortal = function(portal){
	if(this.isMe){
		var dest = portal.Portal.dest;
		this.gameObject.anchoredX = dest.x;
		this.gameObject.anchoredY = dest.y;
        ServerManager.instance.sendMessage("move", {t: "pos", uuid: this.uuid, x: dest.x, y: dest.y});
        SoundManager.instance.play('portal');
	}
};

Player.prototype.onConfirmTouchFlag = function(){
	if(this.gameObject){
		this.stop();
		this.gameObject.phaser.body.enable = false;
		this.playerImage.visible = false;
		this.nameTag.visible = false;
		this.title.visible = false;
		//this.gameObject.alpha = 0;
        if(this.isMe){
            SoundManager.instance.play('win');
        }
	}
};

Player.prototype.onTouchGround = function() {
	if(!this.controlable){
		this.isControlJustBack = true;
	}
	this.controlable = true;

	if(this.isMe){
		this.sendMovePack('pos');
	}
};

Player.prototype.sendMovePack = function(action) {
	var posX = Math.round(this.gameObject.anchoredX);
	var posY = Math.round(this.gameObject.anchoredY);
	ServerManager.instance.sendMessage("move", {t:action, uuid: this.uuid, x: posX, y: posY});
};

Player.prototype.sendThrowPack = function(p) {
	var ps = p.Player;
	var posX = Math.round(this.gameObject.anchoredX);
	var posY = Math.round(this.gameObject.anchoredY);
	ServerManager.instance.sendMessage("move", {t:"throw", uuid: this.uuid, dir: (this.isFacingLeft ? 0 : 1), target: ps.uuid, x: posX, y: posY});
	//ServerManager.instance.send('{"k":"move", "v": {"t":"thrower", "uuid": ' + this.uuid + ', "x":' + posX + ', "y":' + posY + '}}');
	//ServerManager.instance.send('{"k":"move", "v": {"t":"throw", "uuid": ' + ps.uuid + ', "x":' + posX + ', "y":' + posY + ', "dir":"' + (this.isFacingLeft ? 0 : 1) + '"}}');
};

Player.prototype.onThrowed = function(dir) {
	var digDir = parseInt(dir);
	this.rigidbody.velocity.y = -this.throwHeight;
	this.rigidbody.velocity.x = (dir == 0 ? -this.throwSpeed : this.throwSpeed);
	this.controlable = false;
};

Player.prototype.onScore = function(data){
	if(data.uuid != this.uuid) return;
	this.score += data.score;
	this.nameTag.text = this.playerName;
	this.showLabel("+" + data.score);
    if(this.isMe){
        GameManager.instance.myScore = this.score;
    }
};

Player.prototype.showLabel = function(text){
	var lbl = this.game.add.clone(this.scoreLabel, this.gameObject.parent);
	lbl.anchoredX = this.gameObject.anchoredX;
	lbl.anchoredY = this.gameObject.anchoredY;
	lbl.ScoreLabel.init(text);
};

Player.prototype.onReceiveMove = function(data) {
	if(data.uuid != this.uuid) return;
	if(this.isMe && !(data.t == 'flag' || data.t == 'throw')) return;

	this.gameObject.anchoredX = parseInt(data.x);
	this.gameObject.anchoredY = parseInt(data.y);
	switch(data.t){
		case 'moveLeft':
			this.move(true);
			break;
		case 'moveRight':
			this.move(false);
			break;
		case 'stop':
			this.stop();
			break;
		case 'dock':
			this.dock();
			break;
		case 'jump':
			this.jump();
			break;
		case 'pick':
			this.pick();
			break;
		case 'throw':
			if(!this.isMe){
				this.throw();
			}
			var target = data.target;
			var p = GameManager.instance.playerMap["p" + target];
			if(p && p.Player){
				p.Player.onThrowed(data.dir);
			}
			break;
		// case 'throw':
		// 	break;
		case 'flag':
			this.onConfirmTouchFlag();
			break;
		case 'kill':
			this.kill();
			break;
		case 'flashed':
			this.flashed();
			break;
		case 'warp':
			this.onWarp();
			break;
	}
};

Player.prototype.isInSaveZone = function() {
	var insafe = false;
	for(var i = 0; i < GameManager.instance.currentLevel.safeZones.length; i++){
		var zone = GameManager.instance.currentLevel.safeZones[i];
		if(this.gameObject.anchoredX <= zone.anchoredX + zone.width / 2 &&
			this.gameObject.anchoredX >= zone.anchoredX - zone.width / 2 &&
			this.gameObject.anchoredY <= zone.anchoredY + 5 &&
			this.gameObject.anchoredY >= zone.anchoredY - zone.height){
				insafe = true;
				break;
			}
	}

	return insafe;
};

Player.prototype.say = function(speech) {
	this.bubble.getScript('qc.wtf.DialogBubble').show(speech, this.uuid);
};

Player.prototype.onLeave = function(data) {
	if(data.uuid != this.uuid) return;
	GameManager.instance.playerMap["p" + data.uuid] = null;
	// wh.Event.unbind('$move', this.onReceiveMove);
	// wh.Event.unbind('$leave', this.onLeave);
	// wh.Event.unbind('$score', this.onScore);
	// wh.Event.unbind('$msg', this.onMsg);
	//
	// if(this.isMe){
	// 	wh.Event.unbind('$flash', this.onFlash);
	// }
	GameManager.instance.removePlayer(this.gameObject);
};

Player.prototype.checkFlash = function() {
	if(GameManager.instance.god){
		return;
	}

	if(GameManager.instance.tick <= GameManager.instance.flashTick + 6){
		this.onFlash();
	}
};

Player.prototype.onFlash = function() {
	if(this.touchedFlag || this.isInSaveZone() || (this.rigidbody.touching.down && this.state == 2)){

	}else{
		this.flashed();
	}
};

Player.prototype.onMsg = function(data) {
	if(data.uuid != this.uuid) return;
	this.say(data.msg);
};
