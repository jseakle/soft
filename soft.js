var game;
var size;
var boardsize;
var framerate;
var images;
var centerpoint;


function randrange(min, max, f) {
    if(max === undefined) {
        max = Math.floor(min)
        min = 0
    } else {
        min = Math.floor(min);
        max = Math.max(min, Math.floor(max));
    }
    if(f) {
        print(123)
        return Math.random() * (max - min) + min
    }
    return Math.floor(Math.random() * (max - min)) + min;
}

function choice(arr) {
    return arr[randrange(arr.length)]
}

function arrayEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

   for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function rnd_pt() {
    var radius = boardsize / 2
    return p5.Vector.add(
        createVector(randrange(-radius, radius),
                     randrange(-radius, radius)),
        centerpoint)
}

class Sprite {

    constructor(name) {
        if(name) {
            this.image = images[name]
        }
    }

    set_position(x, y) {
        this.center_x = x
        this.center_y = y
    }

    set_pos(vec) {
        this.pos_vec = vec
        this.center_x = vec.x
        this.center_y = vec.y
    }


    draw() {
        if(this.image === undefined) {
            return 'weird'
        }
        push()
        if(this.center_x === undefined) {
            console.log(1)
        }
        translate(this.center_x, this.center_y)
        if(this.scale) {
            scale(this.scale)
        }

        if(this.angle) {
            rotate(this.angle)
        }
        image(this.image, -this.image.width/2, -this.image.height/2)
        pop()
    }

}

class Speed extends Sprite {

    constructor() {
        super("speed")
        this.scale = .25
        this.set_pos(createVector(size + 140, 190))
    }

    draw() {
        super.draw()
        push()
        fill(0,0,0)
        textSize(28)
        text("" + int(game.player.speed * 10), this.center_x + 90 + (game.player.speed > 9 ? 15 : 0), this.center_y + 8)
        pop()
    }
}

class Score extends Sprite {

    constructor() {
        super("score")
        this.scale = .3
        this.set_pos(createVector(size + 150, 120))
    }

    draw() {
        super.draw()
        push()
        fill(0,0,0)
        textSize(28)
        text("" + int(game.score * 10), this.center_x + 80 + ((game.score > 9 || game.score < -1) ? 15 : 0), this.center_y + 15)
        pop()
    }
}


class Softness extends Sprite {

    constructor() {
        super("softness")
        this.scale = .3
        this.set_pos(createVector(size + 120, 230))
    }

    draw() {
        super.draw()
        push()
        fill(0,0,0)
        textSize(28)
        text("" + int(game.player.softness * 10), this.center_x + 115 + (game.player.softness > 9 ? 15 : 0), this.center_y + 20)
        pop()
    }
}

class Distance extends Sprite {

    constructor() {
        super("distance")
        this.scale = .3
        this.set_pos(createVector(size + 100, 300))
    }

    draw() {
        super.draw()
        push()
        fill(0,0,0)
        textSize(28)
        text("" + int(game.player.distance), this.center_x + 140, this.center_y + 15)
        pop()
    }
}

class Hunger extends Sprite {

    constructor() {
        super("hunger")
        this.scale = .3
        this.set_pos(createVector(size + 100, 370))
    }

    draw() {
        super.draw()
        push()
        fill(0,0,0)
        textSize(28)
        text("" + int(game.hunger), this.center_x + 140, this.center_y + 15)
        pop()
    }
}


class Cookie extends Sprite {

    constructor(image) {
        super(image)
        this.dead = false

        // pick a point inside the circle
        this.set_pos(rnd_pt())
        var attempts = 10
        while(this.pos_vec.dist(centerpoint) > boardsize/2 ||
              game.near(this.pos_vec, 75)) {
            this.set_pos(rnd_pt())
            attempts--
            if(attempts == 0) {
                this.set_pos(createVector(-30, -30))
                break
            }
        }
        
    }

    eat() {
        if(!this.dead) {
            play("chomp")
        }
        this.dead = true
        game.hunger -= 1
        this.grant()
        
    }

    draw() {
        super.draw()
    }

}

class Soft extends Cookie {

    constructor() {
        super("soft")
        this.scale = .068
    }

    grant() {
        game.player.softness += .2
        game.animations.push(new SoftAnim(2))
        print(game.animations)
        game.player.size += 1
        game.player.scale += .003
        game.player.speed -= .2
        game.animations.push(new SpeedAnim(-2))
        game.player.distance += 3
        game.animations.push(new DistAnim(3))
                              
    }
}

class Fast extends Cookie {

    constructor() {
        super("fast")
        this.scale = .14
    }

    grant() {
        game.player.speed += .4
        game.animations.push(new SpeedAnim(4))
        game.player.size -= .5
        game.player.scale -= .002
    }
}

class Short extends Cookie {

    constructor() {
        super("short")
        this.scale = .12
    }

    grant() {
        if(game.player.distance > 50) {
            print(game.player.scale)
            game.player.distance -= 7
            game.animations.push(new DistAnim(-7))
            game.player.size -= .25
            game.player.scale -= .001
            print(game.player.scale)

        }
    }
}


class Friend extends Sprite {

    constructor(value) {
        super('friend')
        this.image.loadPixels()
        
        var newimg = new p5.Image(this.image.width, this.image.height)
        newimg.loadPixels()

        for (let i = 0; i < this.image.pixels.length; i+=4) {
            if(this.image.pixels[i] > 140 &&
               this.image.pixels[i+1] > 140 &&
               this.image.pixels[i+2] > 140) {
                newimg.pixels[i] = this.image.pixels[i] - Math.ceil((value - .5) * 8)
                newimg.pixels[i+1] = this.image.pixels[i] - Math.ceil((value - .5) * 100)                
            } else {
                newimg.pixels[i] = this.image.pixels[i]
                newimg.pixels[i+1] = this.image.pixels[i+1]
            }
            newimg.pixels[i+2] = this.image.pixels[i+2]
            newimg.pixels[i+3] = this.image.pixels[i+3]
        }
        newimg.updatePixels()
        this.image = newimg

        
        this.value = value
        this.speed = 4 + value
        this.charge_timer = framerate * 2
        this.dead = false

        // pick a point inside the circle
        this.set_pos(rnd_pt())
        var attempts = 10
        while(this.pos_vec.dist(centerpoint) > boardsize/2 ||
              game.near(this.pos_vec, 15)) {
            this.set_pos(rnd_pt())
            attempts--
            if(attempts == 0) {
                this.set_pos(createVector(-30, -30))
                break
            }
        }

        var opp_quadrant = [this.pos_vec.x <= centerpoint.x,
                            this.pos_vec.y < centerpoint.y]
        //pick a target in a the opposite quadrant
        var target = rnd_pt()
        var target_quad = [target.x >= centerpoint.x,
                           target.y > centerpoint.y]
        while(target.dist(centerpoint) > boardsize/2 ||
              !arrayEqual(target_quad, opp_quadrant)) {
            target = rnd_pt()
            target_quad = [target.x >= centerpoint.x,
                           target.y > centerpoint.y]
        }
        target = p5.Vector.sub(target, centerpoint)
        target.setMag(size*3)
        target = p5.Vector.add(target, centerpoint)
        
        this.target = target

        this.arrow = new Sprite('arrow')
        this.arrow.set_pos(this.pos_vec)

    }

    get_caught() {
        if(!this.dead) {
            play("score")
            game.score += this.value
        }
        this.dead = true
    }

    shatter() {
        if(!this.dead) {
            game.score -= this.value
            play("shatter")
            game.animations.push(new Shatter(this.pos_vec, this.value))
        }
        this.dead = true
    }

    draw() {
        if(this.pos_vec.dist(centerpoint) > boardsize / 2) {
            this.shatter()
            return
        }
        var mov_vec = p5.Vector.sub(this.target, this.pos_vec)
        if(this.charge_timer > 0) {
            this.charge_timer -= 1
            this.arrow.angle = mov_vec.heading()
        } else {
            mov_vec.setMag(this.speed)
            var result_vec = p5.Vector.add(this.pos_vec, mov_vec)
            this.set_pos(result_vec)
        }

        super.draw()
        if(this.charge_timer > 0) {
            this.arrow.draw()
        }
    }

}

class Shatter extends Sprite {

    constructor(pos_vec, value) {
        super('shatter')
        this.image.loadPixels()

        var newimg = new p5.Image(this.image.width, this.image.height)
        newimg.loadPixels()

        for (let i = 0; i < this.image.pixels.length; i+=4) {
            if(this.image.pixels[i] > 140 &&
               this.image.pixels[i+1] > 140 &&
               this.image.pixels[i+2] > 140) {
                newimg.pixels[i] = this.image.pixels[i] - Math.ceil((value - .5) * 8)
                newimg.pixels[i+1] = this.image.pixels[i] - Math.ceil((value - .5) * 100)
            } else {
                newimg.pixels[i] = this.image.pixels[i]
                newimg.pixels[i+1] = this.image.pixels[i+1]
            }
            newimg.pixels[i+2] = this.image.pixels[i+2]
            newimg.pixels[i+3] = this.image.pixels[i+3]
        }
        newimg.updatePixels()
        this.image = newimg

        this.timer = framerate
        this.pos_vec = pos_vec
        this.set_position(pos_vec.x, pos_vec.y)
    }

    draw() {
        if(this.timer > 0) {
            this.timer -= 1
            super.draw()
        }
    }
}

class SoftAnim {

    constructor(value) {
        this.timer = framerate
        this.value = value
    }

    draw() {
        if(this.timer > 0) {
            this.timer -= 1

            push()
            noStroke()
            if(this.value > 0) {
                fill(47, 235, 63)
            } else {
                fill(237, 24, 0)
            }
            textSize(28)
            var sym = this.value > 0 ? "+" : ""
            text(sym + int(this.value), size + 280, 250)
            pop()
        }
    }
}

class SpeedAnim {

    constructor(value) {
        this.timer = framerate
        this.value = value
    }

    draw() {
        if(this.timer > 0) {
            this.timer -= 1

            push()
            noStroke()
            if(this.value > 0) {
                fill(47, 235, 63)
            } else {
                fill(237, 24, 0)
            }
            textSize(28)
            var sym = this.value > 0 ? "+" : ""
            text(sym + int(this.value), size + 280, 198)
            pop()
        }
    }
}

class DistAnim {

    constructor(value) {
        this.timer = framerate
        this.value = value
    }

    draw() {
        if(this.timer > 0) {
            this.timer--
            push()
            noStroke()
            if(this.value > 0) {
                fill(47, 235, 63)
            } else {
                fill(237, 24, 0)
            }
            textSize(28)
            var sym = this.value > 0 ? "+" : ""
            text(sym + this.value, size + 285, 315)
            pop()
        }
    }
}

class Player extends Sprite {

    constructor() {
        super('cloud')
        this.source = images['cloud_source']
        this.source.loadPixels()
        this.image.loadPixels()

        this.scale = .06

        this.size = 0
        this.speed = 3
        this.distance = 150
        this.targets = [null, null, null]
        this.softness = .8
        this.center_x = size/2
        this.center_y = size/2
        this.pos_vec = createVector(this.center_x, this.center_y)
    }

    // add a target at vec
    push_target(vec) {
        var old = null
        if(this.targets[0] === null) {
            old = this.pos_vec
        } else {
            for(var i = 1; i < this.targets.length; i++) {
                if(this.targets[i] === null) {
                    old = this.targets[i-1]
                    break
                }
            }
        }
        if(old === null) { return; }

        
        var loc = p5.Vector.sub(vec, old)
        loc.setMag(this.distance)
        loc = p5.Vector.add(loc, old)

        for(var i = 0; i < this.targets.length; i++) {
            if(this.targets[i] === null) {
                this.targets[i] = loc
                break
            }
        }
    }


    pop_target() {
        for(var i = this.targets.length - 1; i > 0; i--) {
            if(this.targets[i] !== null) {
                this.targets[i] = null
                break
            }
        }
    }

    collide() {
        game.friends.forEach((friend) => {
            if(friend.charge_timer == 0 &&
               friend.pos_vec.dist(this.pos_vec) < 22 + this.size) {
                if(friend.value > this.softness) {
                    friend.shatter()
                } else {
                    friend.get_caught()
                }
            }
        })

        game.cookies.forEach((cookie) => {
            if(cookie.pos_vec.dist(this.pos_vec) < 25 + this.size) {
                cookie.eat()
            }
        })

    }


    draw() {
        var dest = this.targets[0]
        if(dest) {
            // how far we have to go to complete the current movement
            var mov_vec = p5.Vector.sub(dest, this.pos_vec)
            var f = false
            if(this.speed >= this.pos_vec.dist(dest)) {
                mov_vec.setMag(this.pos_vec.dist(dest))
                this.targets[0] = this.targets[1]
                this.targets[1] = this.targets[2]
                this.targets[2] = null
                f = true
            } else {
                mov_vec.setMag(this.speed)
            }
            var result_vec = p5.Vector.add(this.pos_vec, mov_vec)
            this.set_pos(result_vec)
        }
        if(this.targets[0]) {
            push()
            noStroke()
            fill(240,0,24)
            circle(this.targets[0].x, this.targets[0].y, 5)
            pop()
        }
        if(this.targets[1]) {
            push()
            noStroke()
            fill(0,24,200)
            circle(this.targets[1].x, this.targets[1].y, 5)
            pop()
        }
        if(this.targets[2]) {
            push()
            noStroke()
            fill(14,250,0)
            circle(this.targets[2].x, this.targets[2].y, 5)
            pop()
        }

        this.collide()

        if(this.softness != this.prev_softness) {
            for (let i = 0; i < this.image.pixels.length; i+=4) {
                if(this.source.pixels[i] > 140 &&
                   this.source.pixels[i+1] > 140 &&
                   this.source.pixels[i+2] > 140) {
                    this.image.pixels[i] = this.source.pixels[i+1] - Math.ceil((this.softness - .5) * 8)
                    this.image.pixels[i+1] = this.source.pixels[i+1] - Math.ceil((this.softness - .5) * 100)
                }
            }
            this.image.updatePixels()
            this.image.mask(images["cloud_mask"])
            this.prev_softness = this.softness
        }
        
        super.draw()
    }
}

document.oncontextmenu = function() {
    return false;
}

function mousePressed(e) {

    if(game.paused || game.hunger <= 0) {
        return
    }
    
    vec = createVector(mouseX, mouseY)
    if(mouseButton === LEFT) {
        game.player.push_target(vec)
    } else if(mouseButton === RIGHT) {
        game.player.pop_target()
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
}

function play(sound) {
    if(!game.muted && !sounds[sound].isPlaying()) {
        sounds[sound].play()
    }
}

function preload() {
    
    soundFormats('mp3', 'wav');

    images = {
        "cloud": loadImage("images/cloud.png"),
        "cloud_source": loadImage("images/cloud.png"),
        "friend": loadImage("images/friend.png"),
        "arrow": loadImage("images/arrow.png"),
        "shatter": loadImage("images/shatter.png"),
        "soft": loadImage("images/soft.png"),
        "cloud_mask": loadImage("images/cloud_mask.png"),
        "fast": loadImage("images/fast.png"),
        "short": loadImage("images/short.png"),
        "score": loadImage("images/score.png"),
        "softness": loadImage("images/softness.png"),
        "distance": loadImage("images/distance.png"),
        "speed": loadImage("images/speed.png"),
        "hunger": loadImage("images/hunger.png"),
        "gameover": loadImage("images/gameover.png"),
    }

    sounds = {
        "shatter": loadSound("sounds/shatter.wav"),
        "chomp": loadSound("sounds/chomp.wav"),
        "score": loadSound("sounds/score.wav"),
    }

}

function setup() {
    size = 700
    boardsize = 600
    framerate = 45
    textAlign(RIGHT)
    frameRate(framerate)
    noStroke()
    centerpoint =createVector(size/2, size/2)
    bgcolor = color(148,201,61)

    game = new Game()
    game.setup()

    let width = size
    let height = width
    createCanvas(width + game.panel_width, height)

}

async function draw() {
    if(!game.paused) {
        game.draw()
    }
}

async function keyReleased() {
    await game.on_key_release(keyCode)
    return false
}

class Game {
    constructor() {
        this.panel_width = 300
        this.friend_rate = 4
        this.cookie_rate = 2
        this.friend_count = 0
        this.paused = false
        this.muted = false
        this.score = 0
        this.hunger = 50
        this.player = new Player()
        this.friends = []
        this.friend_timer = framerate * 5
        this.cookies = []
        this.cookie_timer = framerate * this.cookie_rate
        this.animations = []
        this.panel_elements = []
    }

    setup() {
        this.cookies.push(new Soft())
        this.panel_elements = [
            new Score(),
            new Softness(),
            new Speed(),
            new Distance(),
            new Hunger(),
        ]
    }

    async on_key_release(k) {
        if(k == 80) { //p
            this.paused = !this.paused
        } else if(k == 77) { //m
            this.muted = !this.muted
        } else if(k == 82) { //r
            game = new Game()
            game.setup()
        }
    }

    near(vec, distance) {
        if(this.cookies.some((cookie) => {
            if(vec.dist(cookie.pos_vec) < distance) {
                return true
            }
        })) {
            return true
        }

        if(this.friends.some((friend) => {
            if(vec.dist(friend.pos_vec) < distance) {
                return true
            }
        })) {
            return true
        }

        if(vec.dist(this.player.pos_vec) < distance) {
            return true
        }
    }
    

    draw() {
        background(245, 162, 228)
        noFill()
        stroke(0,0,0)
        circle(centerpoint.x, centerpoint.y, boardsize)

        
        if(this.hunger > 0) {
            this.friends = this.friends.filter(friend => !friend.dead)
            this.cookies = this.cookies.filter(cookie => !cookie.dead)


            if(this.friend_timer > 0) {
                this.friend_timer -= 1
            } else {
                this.friend_count += 1
                var value;
                if(this.friend_count < 25) {
                    value = randrange(.5 + this.friend_count / 12, 1.5 + this.friend_count / 9, true)
                } else {
                    value = randrange(1 + this.friend_count / 15, 2 + this.friend_count / 11, true)
                }
                print(this.player.softness, value)
                this.friends.push(new Friend(value))
                this.friend_timer = framerate * this.friend_rate
                this.friend_rate -= .05
                if(this.friend_rate < .5) {
                    this.friend_rate = .5
                }
            }

            if(this.cookie_timer > 0) {
                this.cookie_timer -= 1
            } else {
                this.cookies.push(choice([new Soft(), new Fast(), new Soft(), new Fast(), new Short()]))

                this.cookie_timer = framerate * this.cookie_rate
                this.cookie_rate -= .02
                if(this.cookie_rate < .5) {
                    this.cookie_rate = .5
                }
            }
        }

        this.animations = this.animations.filter(anim => anim.timer > 0)
        
        this.friends.forEach((friend) => {
            friend.draw()
        })
        this.cookies.forEach((cookie) => {
            cookie.draw()
        })
        this.animations.forEach((anim) => {
            anim.draw()
        })
        this.panel_elements.forEach((elt) => {
            elt.draw()
        })

        this.player.draw()

        if(this.hunger <= 0) {
            image(images["gameover"], 100, 100)
        }

    }
}
