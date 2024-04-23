const gameScene = new Phaser.Scene();

gameScene.init = function () {
    this.playerSpeed = 3;
    this.zombieSpeed = 1;
    this.isGunPickedUp = false;
    this.playerDirection = "Down";
    this.isGameOver = false;
    this.bullets = [];
    this.bulletSpeed = 20;
}

gameScene.preload = function () {
    this.load.spritesheet('cowboy', 'assets/images/cowboy.png', {
        frameWidth: 32,
    });

    this.load.spritesheet('zombie', 'assets/images/zombie.png', {
        frameWidth: 32
    });

    this.load.image('gun', 'assets/images/gun.png');

    this.load.image('bullet', 'assets/images/bullet.png')
}

gameScene.create = function () {
    this.player = this.add.sprite(320, 180, 'cowboy', 0)
        .setScale(1.1)

    this.gun = this.add.sprite(100, 100, 'gun');

    this.zombies = this.add.group();

    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            this.zombies.add(
                this.add.sprite(
                    Math.random() * 1000,
                    Math.random() * 1000,
                    'zombie'
                ).setScale(2 )
            )
        }
    })

    this.createZombieAnimations();
    this.createCowboyAnimations();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cursors.space.on('up', () => {
        if (!this.isGunPickedUp) return;

        const sprite = this.add.sprite(this.player.x, this.player.y + 5, 'bullet').setScale(.3);

        switch (this.playerDirection) {
            case "Down":
                sprite.setAngle(180)
                break;

            case "Right":
                sprite.setAngle(90);
                break;

            case "Left":
                sprite.setAngle(-90);
                break;
        }

        this.bullets.push({ sprite, direction: this.playerDirection });
    });
}

gameScene.getBulletPosition = function(bullet) {
    const { sprite: { x, y }} = bullet;

    switch(bullet.direction) {
        case "Up": return { x: x, y: y - this.bulletSpeed }
        case "Down": return { x: x, y: y + this.bulletSpeed }
        case "Right": return { x: x + this.bulletSpeed, y: y  }
        case "Left": return { x: x - this.bulletSpeed, y: y }
        default: throw new Error('Direction not allowed');
    }
}

gameScene.updateBulletPositions = function() {
    for (const bullet of this.bullets) {
        const { x, y } = this.getBulletPosition(bullet);

        bullet.sprite.setPosition(x, y);
    }
}

gameScene.update = function () {
    if (this.isGameOver) {
        this.player.setTint(0xff0000);
        this.player.anims.stop();

        for (const zombie of this.zombies.getChildren()) {
            zombie.anims.stop();
        }

        setTimeout(() => {
            this.scene.restart();
        }, 1000);

        return;
    }

    this.updateBulletPositions();
    this.updateZombie();
    this.updatePlayer();

    this.cameras.main.pan(this.player.x, this.player.y, 0);

    for (const zombie of this.zombies.getChildren()) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(zombie.getBounds(), this.player.getBounds())) {
            this.isGameOver = true;
        }

        for (const bullet of this.bullets) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.sprite.getBounds(), zombie.getBounds())) {
                zombie.setAngle(90);
                zombie.isDead = true;
                bullet.sprite.destroy();
                const index = this.bullets.indexOf(bullet);
                this.bullets.splice(index, 1);
                zombie.anims.stop();

                setTimeout(() => {
                    zombie.destroy();
                }, 500)
            }
        }
    }

    if (Phaser.Geom.Intersects.RectangleToRectangle(this.gun.getBounds(), this.player.getBounds())) {
        this.isGunPickedUp = true;
        this.gun.visible = false;
    }
}

gameScene.updatePlayer = function () {
    const { down, left, right, up } = this.cursors;
    this.isMoving = false;

    if (down.isDown) {
        this.player.y += this.playerSpeed;
        this.isMoving = true;
        this.playerDirection = 'Down';
    }

    if (up.isDown) {
        this.player.y -= this.playerSpeed;
        this.isMoving = true;
        this.playerDirection = "Up";
    }

    if (right.isDown) {
        this.player.x += this.playerSpeed;
        this.isMoving = true;
        this.playerDirection = "Right";
    }

    if (left.isDown) {
        this.player.x -= this.playerSpeed;
        this.isMoving = true;
        this.playerDirection = "Left";
    }

    const animation = this.getCurrentPlayerAnimation();

    this.player.anims.play(animation, true);
}

gameScene.getCurrentPlayerAnimation = function() {
    let animation = this.isMoving ? 'cowboy' : 'idle';

    if (this.isGunPickedUp) {
        animation += 'WithGun';
    }

    animation += this.playerDirection;

    return animation;
}

gameScene.updateZombie = function () {
    for (const zombie of this.zombies.getChildren()) {
        if (zombie.isDead) continue;

        const possiblePoints = [
            {x: zombie.x - this.zombieSpeed, y: zombie.y},
            {x: zombie.x + this.zombieSpeed, y: zombie.y},
            {x: zombie.x, y: zombie.y - this.zombieSpeed},
            {x: zombie.x, y: zombie.y + this.zombieSpeed},
            {x: zombie.x - this.zombieSpeed, y: zombie.y - this.zombieSpeed},
            {x: zombie.x + this.zombieSpeed, y: zombie.y + this.zombieSpeed},
            {x: zombie.x - this.zombieSpeed, y: zombie.y + this.zombieSpeed},
            {x: zombie.x + this.zombieSpeed, y: zombie.y - this.zombieSpeed},
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

gameScene.createCowboyAnimations = function() {
    this.anims.create({
        key: 'cowboyUp',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 4, end: 5 }),
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
        frames: this.anims.generateFrameNumbers('cowboy', { start: 10, end: 11 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyLeft',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 7, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'idleDown',
        frames: [{ key: 'cowboy', frame: 0 }]
    });

    this.anims.create({
        key: 'idleUp',
        frames: [{ key: 'cowboy', frame: 3 }]
    });

    this.anims.create({
        key: 'idleLeft',
        frames: [{ key: 'cowboy', frame: 6 }]
    });

    this.anims.create({
        key: 'idleRight',
        frames: [{ key: 'cowboy', frame: 9 }]
    });

    this.anims.create({
        key: 'cowboyWithGunUp',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 16, end: 17 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyWithGunRight',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 19, end: 20 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'cowboyWithGunLeft',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 21, end: 22 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'cowboyWithGunDown',
        frames: this.anims.generateFrameNumbers('cowboy', { start: 13, end: 14 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'idleWithGunLeft',
        frames: [{ key: 'cowboy', frame: 21 }]
    });

    this.anims.create({
        key: 'idleWithGunRight',
        frames: [{ key: 'cowboy', frame: 18 }]
    });

    this.anims.create({
        key: 'idleWithGunUp',
        frames: [{ key: 'cowboy', frame: 15 }]
    });

    this.anims.create({
        key: 'idleWithGunDown',
        frames: [{ key: 'cowboy', frame: 12 }]
    });
}

gameScene.createZombieAnimations = function() {
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
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 360,
    scene: gameScene,
    title: 'Zombie Assault',
    backgroundColor: "#555",
    pixelArt: true
}

new Phaser.Game(config);