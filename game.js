var THRUST_POWER = 250;
var ROTATION_SPEED = 200;
var MAX_ENEMY_COUNT = 7;
//var MAX_ENEMY_COUNT = 10;
var ENEMY_MIN_SPEED = 50;
var ENEMY_MAX_SPEED = 150;
var O2_HIT_POWER = 20;
var O2_PORTAL_BONUS = 15;
var PORTAL_SCORE_INCREMENT = 25;

var currentThrustPower = THRUST_POWER;
var currentRotationSpeed = ROTATION_SPEED;

var worldBounds = {x:0, y:0, width: 800, height: 600};
var colors = [0xFF5555, 0x55FF55, 0x5555FF, 0xFFFF55];
var cursors;
var player;
var portalGroup;
var enemyGroup;
var levelShakeCounter = 0;
var background;
var portalLabels = [];
var portalScores = [0,0,0,0];
var oxygen = 100;
var oxygenLabel;
var gameOverLabel;
var finishLabel;
var gameOver = false;
var gameStarted = false;
var deadPortalCount = 0;
var gameStartLabel;
var logo;

var gameState;

var GameState = function(game) {
    this.game = game;
    gameState = this;
};

GameState.prototype.preload = function() {

	game.load.image('background', 'assets/background.jpg');
	game.load.spritesheet('man', 'assets/astro-sheet.png', 64, 64);
	game.load.image('mars', 'assets/marsbw.png');
	game.load.spritesheet('rocks', 'assets/rocks.png?1', 128,128);
	game.load.audio('sfx', 'assets/fx_mixdown.mp3');

};

GameState.prototype.create = function() {

	SoundPlayer.init(game);

	//game.stage.backgroundColor = '#020134';
	game.physics.startSystem(Phaser.Physics.BOX2D);	

    //game.physics.box2d.gravity.y = 400;
    game.physics.box2d.density = 1;
    game.physics.box2d.friction = 0.3;
    game.physics.box2d.restitution = 0.2;

    background = game.add.sprite(game.width*0.5,game.height*0.5,'background');
    background.anchor.setTo(0.5,0.5);

	this.createPortals();

	this.createEnemies();			

	player = this.createPlayer();

	player.body.setCategoryContactCallback(2, playerPortalCallback, this);
	player.body.setCategoryContactCallback(3, playerEnemyCallback, this);

	gameOverLabel = createText(game.width*0.5, game.height*0.5, 90, "GAME OVER");
	gameOverLabel.anchor.setTo(0.5,0.5);
	gameOverLabel.visible = false;

	finishLabel = createText(game.width*0.5, game.height*0.5, 60, "such amaze\n    ┌ಠ_ಠ)\nmuch wow");
	finishLabel.anchor.setTo(0.5,0.5);
	finishLabel.visible = false;

	gameStartLabel = createText(game.width*0.5, game.height-50, 24, "press any key to start");
	gameStartLabel.anchor.setTo(0.5,0.5);
	gameStartLabel.visible = true;	

	logo = createText(game.width*0.5, game.height*0.5-40, 72, "BUSTEROIDS");
	logo.anchor.setTo(0.5,0.5);

	oxygenLabel = createText(5, 575, 20, "OXYGEN: 100%");

	game.time.events.repeat(250, 26, function() {
		if (!gameStarted) {
			gameStartLabel.visible = !gameStartLabel.visible;
		}
	}, this);


	game.time.events.loop(Phaser.Timer.SECOND * 3, function() {
		if (gameStarted && !gameOver) {
			decrementOxygen(1);
		}
	}, this);

	cursors = game.input.keyboard.createCursorKeys();

	game.input.keyboard.addKeyCapture([32,37,38,39,40]);

	game.input.keyboard.onDownCallback = function(e) {
		
		//console.log(e.keyCode);

		if (e.keyCode == 27) {  //ESC
			console.log("RESTART");
			gameState.restart();			
		}

		if (e.keyCode == 49) {
			//decrementOxygen(100);
		}

		if (gameStarted == false) {
			logo.visible = false;
			gameStartLabel.visible = false;
			gameStarted = true;

			player.blinkingTimer = 250;

			SoundPlayer.play("nextlevel");

			enemyGroup.forEach(function(enemy) {

		    	//enemy.body.velocity.x = game.rnd.between(0,1) == 0 ? game.rnd.between(-200,-100) : game.rnd.between(100,200);
    			//enemy.body.velocity.y = game.rnd.between(0,1) == 0 ? game.rnd.between(-200,-100) : game.rnd.between(100,200);

    			enemy.body.velocity.x = game.rnd.between(-100,100);
    			enemy.body.velocity.y = game.rnd.between(-100,100);

			});

		}
	}	

}

GameState.prototype.restart = function() {

	levelShakeCounter = 0;
	portalScores = [0,0,0,0];
	oxygen = 100;
	oxygenLabel.text = "OXYGEN: " + oxygen + "%";
	
	gameOverLabel.visible = false;
	finishLabel.visible = false;
	gameStartLabel.visible = false;
	logo.visible = false;
	gameOver = false;
	gameStarted = true;
	currentThrustPower = THRUST_POWER;
	currentRotationSpeed = ROTATION_SPEED;

	deadPortalCount = 0;

	portalGroup.destroy(true);
	enemyGroup.destroy(true);

	player.circle.destroy(true);
	player.destroy(true);

	for (var i=0;i<portalLabels.length;++i) {
		portalLabels[i].destroy();
	}

	this.createPortals();

	this.createEnemies();

	player = this.createPlayer();

	player.body.setCategoryContactCallback(2, playerPortalCallback, this);
	player.body.setCategoryContactCallback(3, playerEnemyCallback, this);	


	player.blinkingTimer = 250;

	enemyGroup.forEach(function(enemy) {

    	//enemy.body.velocity.x = game.rnd.between(0,1) == 0 ? game.rnd.between(-200,-100) : game.rnd.between(100,200);
		//enemy.body.velocity.y = game.rnd.between(0,1) == 0 ? game.rnd.between(-200,-100) : game.rnd.between(100,200);

		enemy.body.velocity.x = game.rnd.between(-100,100);
		enemy.body.velocity.y = game.rnd.between(-100,100);

	});

	SoundPlayer.play("nextlevel");

}

GameState.prototype.update = function() {

	player.circle.x = player.body.x;
	player.circle.y = player.body.y;

	if (player.body.x > game.width+player.width*0.5) player.body.x = -player.width*0.5;
    if (player.body.x < -player.width*0.5) player.body.x = game.width+player.width*0.5;
    if (player.body.y > game.height+player.height*0.5) player.body.y = -player.height*0.5;
    if (player.body.y < -player.height*0.5) player.body.y = game.height+player.height*0.5;

    enemyGroup.forEach(function(enemy) {
    	if (enemy.body.x > game.width + enemy.width*0.5) enemy.body.x = -enemy.width*0.5;
	    if (enemy.body.x < -enemy.width*0.5) enemy.body.x = game.width + enemy.width*0.5;
	    if (enemy.body.y > game.height + enemy.height*0.5) enemy.body.y = -enemy.height*0.5;
	    if (enemy.body.y < -enemy.height*0.5) enemy.body.y = game.height + enemy.height*0.5;
    });
	

	if (!gameOver) {

		player.body.setZeroRotation();

		if (cursors.left.isDown)
		{
		    player.body.rotateLeft(currentRotationSpeed);
		}
		else if (cursors.right.isDown)
		{
		    player.body.rotateRight(currentRotationSpeed);
		}

		if (cursors.up.isDown)
		{
		    player.body.thrust(currentThrustPower);
		    player.frame = 1;
		}
		else if (cursors.down.isDown)
		{
		    //player.body.thrust(-THRUST_POWER);
		    //player.frame = 1;
		}
		else {
			player.frame = 0;
		}

	}

    if (levelShakeCounter > 0) {

        var rand1 = game.rnd.integerInRange(-10,10);
        var rand2 = game.rnd.integerInRange(-10,10);

        game.world.setBounds(rand1, rand2, worldBounds.width, worldBounds.height);
        if (--levelShakeCounter == 0) {
            game.world.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height);
            game.physics.box2d.setBoundsToWorld(false, false, false, false);
        }

    }

    if (player.blinkingTimer > 0) {

    	if (--player.blinkingTimer % 8 == 0) {
    		player.visible = !player.visible;
    		player.circle.visible = !player.circle.visible;
    	}

    	if (player.blinkingTimer == 0) {
    		player.visible = true;
    		player.circle.visible = true;
    	}

    }

}

GameState.prototype.render = function() {

	//game.debug.box2dWorld();

};

GameState.prototype.spawnEnemy = function() {
	
	var colorIndex;

	var exists = false;
	enemyGroup.forEach(function(enemy) {
		if (enemy.colorIndex == player.colorIndex) {
			exists = true;
		}
	});

	if (exists == false) {
		colorIndex = player.colorIndex;
	}
	else {
		colorIndex = game.rnd.between(0,colors.length-1);
	}
	
	/*
	while (true) {
		colorIndex = game.rnd.between(0,colors.length-1);
		if (portalScores[colorIndex] < 100) {
			//var colorNames = ["red","green","blue","yellow"];
			//console.log("SPAWNING ",colorNames[colorIndex]);
			break;
		}
	};
	*/

	var enemy = this.createEnemy(game.rnd.between(0,game.width), game.rnd.between(0,game.height), colorIndex);
	enemyGroup.add(enemy);

	enemy.body.sensor = true;
	enemy.alpha = 0;
	enemy.body.isSpawning = true;

	var tw = game.add.tween(enemy);
	tw.to({ alpha: 1.0 }, 3000, "Linear", true);
	tw.onComplete.add(function() {
		enemy.body.sensor = false;
		enemy.body.isSpawning = false;
	}, this);


}

function createPlayerCircle(color, width, radius) {

	var circle = game.add.sprite(0,0);
	var g = game.add.graphics(0,0);
	g.lineStyle(width, color);
	g.drawCircle(0, 0, radius);
	g.endFill();
	circle.addChild(g);

	circle.color = color;
	circle.smoothed = true;

	return circle;

}

GameState.prototype.createPlayer = function() {

	var sprite = game.add.sprite(game.width*0.5,game.height*0.5+25,'man',0);
	sprite.anchor.setTo(0.5,0.5)
	sprite.frame = 0;

	sprite.circle = createPlayerCircle(colors[0], 1, 45);
	sprite.colorIndex = 0;
	sprite.smoothed = true;

	game.physics.box2d.enable(sprite);
    sprite.body.setCircle(sprite.width *0.4);

	return sprite;

}

GameState.prototype.createEnemy = function(x, y, colorIndex) {

	var enemy = game.add.sprite(x, y, 'rocks', colorIndex);
	enemy.anchor.setTo(0.5,0.5)
	enemy.tint = colors[colorIndex];
	enemy.colorIndex = colorIndex;
	enemy.smoothed = true;

	game.physics.box2d.enable(enemy);
    enemy.body.setCircle(40);
    //enemy.body.setPolygon(vertices);
    enemy.body.restitution = 0.9;
    //enemy.body.sensor = true;
    enemy.body.setCollisionCategory(3);

    enemy.body.rotateLeft(game.rnd.between(-100,100));
    //enemy.body.moveForward(100);
    enemy.body.velocity.x = game.rnd.between(0,1) == 0 ? game.rnd.between(-ENEMY_MAX_SPEED,-ENEMY_MIN_SPEED) : game.rnd.between(ENEMY_MIN_SPEED,ENEMY_MAX_SPEED);
    enemy.body.velocity.y = game.rnd.between(0,1) == 0 ? game.rnd.between(-ENEMY_MAX_SPEED,-ENEMY_MIN_SPEED) : game.rnd.between(ENEMY_MIN_SPEED,ENEMY_MAX_SPEED);

	return enemy;

}

GameState.prototype.createPortals = function() {

	function createCircle(x, y, size, colorIndex) {

		/*var sprite = game.add.sprite(x, y);
		sprite.anchor.setTo(0.5,0.5)

		var g = game.add.graphics(0,0);
		
		g.beginFill(colors[colorIndex]);
		g.drawCircle(0, 0, size);
		g.endFill();

		sprite.addChild(g);
		sprite.alpha = 0.2;
		sprite.colorIndex = colorIndex;

		game.physics.box2d.enable(sprite);
	    sprite.body.setCircle(size / 2);
	    sprite.body.sensor = true;
	    sprite.body.setCollisionCategory(2);*/

	    var sprite = game.add.sprite(x, y, 'mars');
	    sprite.anchor.setTo(0.5,0.5);
	    sprite.colorIndex = colorIndex;
	    //sprite.alpha = 0.5;
	    sprite.scale.x = 2.4;
	    sprite.scale.y = 2.4;
	    sprite.smoothed = false;
	    sprite.tint = colors[colorIndex];

		game.physics.box2d.enable(sprite);
	    sprite.body.setCircle(size * 0.4);
	    sprite.body.sensor = true;
	    sprite.body.setCollisionCategory(2);

	    return sprite;

	}

	portalGroup = game.add.group();

	var c1 = createCircle(150, 150, 150, 0);
	var c2 = createCircle(game.width-150, 150, 150, 1);
	var c3 = createCircle(150, game.height-150, 150, 2);
	var c4 = createCircle(game.width-150, game.height-150, 150, 3);

	portalGroup.add(c1);
	portalGroup.add(c2);
	portalGroup.add(c3);
	portalGroup.add(c4);

	portalLabels[0] = createText(120, 130, 40, "0%");
	portalLabels[1] = createText(120 + 500, 130, 40, "0%");
	portalLabels[2] = createText(120, 130 + 300, 40, "0%");
	portalLabels[3] = createText(120 + 500, 130 + 300, 40, "0%");

}

GameState.prototype.createEnemies = function() {

	enemyGroup = game.add.group();

	for (var i=0;i<MAX_ENEMY_COUNT;++i) {
		var colorIndex = game.rnd.between(0,colors.length-1);
		var enemy = this.createEnemy(game.rnd.between(0,game.width), game.rnd.between(0,game.height), colorIndex);
		enemy.body.setZeroVelocity();
		enemyGroup.add(enemy);		
	}


}

function createText(x, y, size, msg) {

	var text = game.add.text(x, y, msg);
    text.font = 'Arial';
    text.fontWeight = 'bold';
    text.fontSize = size;
    text.fill = '#ffffff';
    text.alpha = 0.3;

    return text;

}

function incrementPortalScore(portalIndex) {

	portalScores[portalIndex] += PORTAL_SCORE_INCREMENT;
	portalLabels[portalIndex].text = portalScores[portalIndex] + "%";
	portalLabels[portalIndex].x = portalLabels[portalIndex].x;

}

function resetPortalScore(portalIndex) {

	portalScores[portalIndex] = 0;
	portalLabels[portalIndex].text = "0%";
	portalLabels[portalIndex].x = portalLabels[portalIndex].x;

}

function incrementOxygen(increment) {

	oxygen += increment;
	if (oxygen > 100) {
		oxygen = 100;
	}

	oxygenLabel.text = "OXYGEN: " + oxygen + "%";

}

function decrementOxygen(decrement) {

	if (gameOver == true) {
		return;
	}

	oxygen -= decrement;
	if (oxygen < 0) {
		oxygen = 0;
		gameOverLabel.visible = true;
		gameOver = true;
		player.frame = 0;
		player.body.rotateLeft(800);

		gameStartLabel.text = "press [esc] to restart";
		gameStartLabel.visible = true;

		SoundPlayer.play("death");
	}
	
	oxygenLabel.text = "OXYGEN: " + oxygen + "%";

}

function playerPortalCallback(body1, body2, fixture1, fixture2, begin) {

	if (gameOver) {
		return;
	}

	if (!begin) {
		//body2.setZeroRotation();
		body2.angularDamping = 2;
		//currentRotationSpeed = ROTATION_SPEED;
		currentThrustPower = THRUST_POWER;
		return;
	}

	body2.rotateLeft(50);
	body2.angularDamping = 0;
	//currentRotationSpeed = ROTATION_SPEED * 0.5;
	currentThrustPower = THRUST_POWER * 0.5;
	player.body.velocity.x *= 0.5;
	player.body.velocity.y *= 0.5;

	player.circle.destroy(true);

	var colorIndex = body2.sprite.colorIndex;

	if (colorIndex != player.colorIndex) {
		SoundPlayer.play("ping");
	}

	if (player.destroyerMode) {
		//player.circle = createPlayerCircle(colors[colorIndex], 4, 60);		
	}
	else {
		player.circle = createPlayerCircle(colors[colorIndex], 1, 45);
	}
	player.circle.x = player.body.x;
	player.circle.y = player.body.y;

	player.colorIndex = colorIndex;


}

function playerEnemyCallback(body1, body2, fixture1, fixture2, begin) {

	if (!begin) {
		return;
	}

	if (player.blinkingTimer > 0) {
		return;
	}

	if (body2.isSpawning == true) {
		return;
	}

	if (gameStarted == false) {
		return;
	}

	if (player.colorIndex == body2.sprite.colorIndex) {

		//if (player.destroyerMode == true) {

			if (body2.goingToDestroy != true && gameOver != true) {

				SoundPlayer.play("alien death");

				var pidx = body2.sprite.colorIndex;
				
				var portalAlive = portalScores[pidx] >= 100 ? false : true;
				if (portalAlive) {
					
					incrementPortalScore(pidx);

					if (portalScores[pidx] >= 100) {
						portalLabels[pidx].x = portalLabels[pidx].x - 15;
						portalLabels[pidx].visible = false;
						//portalGroup.children[pidx].destroy(true);
						var portal = portalGroup.children[pidx];
						portal.body.velocity.y = 200;
						portal.body.rotateLeft(100);

						incrementOxygen(O2_PORTAL_BONUS);

						if (++deadPortalCount == 4) {
							gameOver = true;
							finishLabel.visible = true;
							player.frame = 0;
							player.body.rotateLeft(800);

							game.time.events.repeat(250, 5, function() {
								SoundPlayer.play("meow");
							}, this);
						}
						else {

							SoundPlayer.play("nextlevel");

						}

					}

				}
				
				var tw = game.add.tween(body2.sprite);
				tw.to({ alpha: 0.0 }, 1000, "Linear", true);
				tw.onComplete.add(function() {
					body2.sprite.destroy(true);

					if (!gameOver) {
						this.spawnEnemy();
					}

				}, this);

				body2.goingToDestroy = true;
				body2.rotateLeft(500);

			}

		//}

	}
	else {

		if (levelShakeCounter == 0) {
			
			levelShakeCounter = 20;			
			decrementOxygen(O2_HIT_POWER);

			var portalAlive = portalScores[player.colorIndex] >= 100 ? false : true;
			if (portalAlive) {
				resetPortalScore(player.colorIndex);
			}

			player.blinkingTimer = 250;

			SoundPlayer.play('hit');

		}		
	}


}

function enemyPortalCallback(body1, body2, fixture1, fixture2, begin) {

	if (!begin) {
		return;
	}

	var body = body1;
    body.rotateLeft(game.rnd.between(-100,100));
    body.velocity.x = game.rnd.between(-200,200);
    body.velocity.y = game.rnd.between(-200,200);

}