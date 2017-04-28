SoundPlayer = {};

SoundPlayer.init = function(game) {

    var sfx = game.add.audio('sfx');
    sfx.allowMultiple = true;

    sfx.addMarker('alien death', 1, 1.0);
    sfx.addMarker('boss hit', 3, 0.5);
    sfx.addMarker('nextlevel', 4, 2.2);
    sfx.addMarker('meow', 8, 0.5);
    sfx.addMarker('collect', 9, 0.1);
    sfx.addMarker('ping', 10, 1.0);
    sfx.addMarker('death', 12, 4.2);
    sfx.addMarker('hit', 17, 1.0);
    sfx.addMarker('squit', 19, 0.3);

    this.sfx = sfx;
	
}

SoundPlayer.play = function(sfxkey) {

    this.sfx.play(sfxkey);

}