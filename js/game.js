const gameScene = new Phaser.Scene();

gameScene.init = function () {
    this.playerSpeed = 3;
    zombieSpeed = 1;
}

gameScene.preload = function () {
    this.load.spritesheet('cowboy', 'assets/images/cowboy.png', {
        frameWidth: 32,
    });

    this.load.spritesheet('zombie', 'assets/images/zombie.png', {
        frameWidth: 32
    })
}

gameScene.create = function () {
    this.player = this.add.sprite(320, 180, 'cowboy', 0)
        .setScale(3);

    this.zombies = this.add.group([{
        key: 'zombie',
        setXY: {
          x: 50,
          y: -200,
          stepX: 150
        },
    }, {
        key: 'zombie',
        setXY: {
            x: 50,
            y: 800,
            stepX: 200
        }
    }]);

    Phaser.Actions.ScaleXY(this.zombies.getChildren(), 3, 3);

    this.anims.create({
        key: 'zombieUp',
        frames: this.anims.generateFrameNumbers('zombie', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'zombieDown',
        frames: this.anims.generateFrameNumbers('zombie', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'zombieRight',
        frames: this.anims.generateFrameNumbers('zombie', { start: 3, end: 4 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'zombieLeft',
        frames: this.anims.generateFrameNumbers('zombie', { start: 5, end: 6 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyUp',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyDown',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyRight',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 7, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyLeft',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 9, end: 10 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'idle',
        frames: [{ key: 'cowboy', frame: 0 }]
    });

    this.cursors = this.input.keyboard.createCursorKeys();
}

gameScene.update = function () {
    this.updateZombie();
    this.updatePlayer();

    this.cameras.main.pan(this.player.x, this.player.y, 0);
}

gameScene.updatePlayer = function () {
    const { down, left, right, up } = this.cursors;
    let animation = 'idle';

    if (down.isDown) {
        this.player.y += this.playerSpeed;
        animation = 'cowboyDown';
        this.player.setAngle(0);
    }

    if (up.isDown) {
        this.player.y -= this.playerSpeed;
        animation = 'cowboyUp';
        this.player.setAngle(180);
    }

    if (right.isDown) {
        this.player.x += this.playerSpeed;
        animation = 'cowboyRight';
        this.player.setAngle(0);
    }

    if (left.isDown) {
        this.player.x -= this.playerSpeed;
        animation = 'cowboyLeft';
        this.player.setAngle(0);
    }

    this.player.anims.play(animation, true);
}

gameScene.updateZombie = function () {
    for (const zombie of this.zombies.getChildren()) {
        const possiblePoints = [
            {x: zombie.x - zombieSpeed, y: zombie.y},
            {x: zombie.x + zombieSpeed, y: zombie.y},
            {x: zombie.x, y: zombie.y - zombieSpeed},
            {x: zombie.x, y: zombie.y + zombieSpeed},
            {x: zombie.x - zombieSpeed, y: zombie.y - zombieSpeed},
            {x: zombie.x + zombieSpeed, y: zombie.y + zombieSpeed},
            {x: zombie.x - zombieSpeed, y: zombie.y + zombieSpeed},
            {x: zombie.x + zombieSpeed, y: zombie.y - zombieSpeed},
        ];

        const {x, y} = possiblePoints.reduce((acc, {x, y}) => {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);

            if (distance < acc.distance) {
                return {
                    distance,
                    x,
                    y
                }
            }

            return acc;
        }, {distance: Infinity, x: 0, y: 0});

        let zombieAnimation;

        if (x < zombie.x) {
            zombieAnimation = 'zombieLeft';
            zombie.setAngle(0);
        }

        if (x > zombie.x) {
            zombieAnimation = 'zombieRight';
            zombie.setAngle(0);
        }

        if (y < zombie.y) {
            zombieAnimation = 'zombieUp';
            zombie.setAngle(180);
        }

        if (y > zombie.y) {
            zombieAnimation = 'zombieDown';
            zombie.setAngle(0);
        }

        zombie.x = x;
        zombie.y = y;

        zombie.anims.play(zombieAnimation, true);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 360,
    scene: gameScene,
    title: 'Zombie Assault',
    backgroundColor: "#999",
    pixelArt: true
}

new Phaser.Game(config);