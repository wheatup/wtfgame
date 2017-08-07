var DialogBubble = qc.defineBehaviour('qc.wtf.DialogBubble', qc.Behaviour, function() {
    this.maxWidth = 160;
}, {
    dialog: qc.Serializer.NODE
});

DialogBubble.prototype.awake = function() {
	this.gameObject.visible = false;
};

DialogBubble.prototype.show = function(dialog, uuid) {
	this.gameObject.visible = false;
	this.gameObject.width = this.maxWidth + 10;
	this.dialog.text = dialog;
	var self = this;

    if(!SoundManager.instance.mute){
    	var audio = document.getElementById("audio");
       audio.src = 'http://tts.baidu.com/text2audio?lan=zh&pid=101&ie=UTF-8&idx=1&tex=' + encodeURI(dialog) + '&per=' + (uuid % 4) + '&ctp=1&cuid=1&pdt=1';
    //audio.src = 'http://tts.baidu.com/text2audio?lan=zh&pid=101&ie=UTF-8&text=' + encodeURI(dialog) + '&spd=5';
        audio.play();
    }
	self.gameObject.visible = true;
	self.gameObject.alpha = 0;
	this.game.timer.add(100, function(){
		if(self.dialog.nativeSize.width < self.maxWidth){
			self.gameObject.width = self.dialog.nativeSize.width + 10;
		}else{
			self.gameObject.width = self.maxWidth + 10;
		}
		self.gameObject.height = self.dialog.nativeSize.height + 10;

		wh.Tween.remove(self.gameObject);
		wh.Tween.get(self.gameObject)
			.to({alpha:1}, 500)
			.wait(5000)
			.to({alpha:0}, 500);
	});
};
