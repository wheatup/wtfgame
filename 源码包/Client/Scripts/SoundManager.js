var SoundManager = qc.defineBehaviour('qc.engine.SoundManager', qc.Behaviour, function() {
    SoundManager.instance = this;
    this.mute = false;
}, {

});

SoundManager.prototype.play = function(s) {
    if(this.mute) return;

    var self = this;
    this.game.assets.load('sound', 'Assets/audio/' + s + '.mp3.bin', function(audio) {
        var sound = self.game.add.sound();
        sound.volume = 0.5;
        if(s == 'on' || s == 'off'){
            sound.volume = 0.2;
        }
        if(s == 'shoot'){
            sound.volume = 0.1;
        }
        sound.audio = audio;
        sound.play();
    });
};
