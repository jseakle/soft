var game;
var size;
var boardsize;
var framerate;
var images;
var centerpoint;


function randrange(min, max) {
    if(max === undefined) {
        max = Math.floor(min)
        min = 0
    } else {
        min = Math.floor(min);
        max = Math.max(min, Math.floor(max));
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
        this.dead = true
        this.grant()
    }

    draw() {
        super.draw()
    }

}

class Soft extends Cookie {

    constructor() {
        super("soft")
    }

    grant() {
        game.player.softness += .2
    }
}

class Fast extends Cookie {

    constructor() {
        super("fast")
    }

    grant() {
        game.player.speed += .5
    }
}

class Short extends Cookie {

    constructor() {
        super("short")
    }

    grant() {
        if(game.player.distance > 50) {
            game.player.distance -= 2
        }
    }
}


class Friend extends Sprite {

    constructor(speed, value) {
        super('friend')
        this.image.loadPixels()

        for (let i = 0; i < this.image.pixels.length; i+=4) {
            if(this.image.pixels[i] > 140 &&
               this.image.pixels[i+1] > 140 &&
               this.image.pixels[i+2] > 140) {
                this.image.pixels[i] -= Math.ceil((this.value - 1) * 8)
                this.image.pixels[i+1] -= Math.ceil((this.value - 1) * 100)
            }
        }
        this.image.updatePixels()

        
        this.speed = speed
        this.value = value
        this.charge_timer = framerate * 3
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
        this.dead = true
        play("chomp")
        game.score += this.value
    }

    shatter() {
        this.dead = true
        play("shatter")
        game.animations.push(new Shatter(this.pos_vec, this.value))
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

        for (let i = 0; i < this.image.pixels.length; i+=4) {
            if(this.image.pixels[i] > 140 &&
               this.image.pixels[i+1] > 140 &&
               this.image.pixels[i+2] > 140) {
                this.image.pixels[i] -= Math.ceil((this.value - 1) * 8)
                this.image.pixels[i+1] -= Math.ceil((this.value - 1) * 100)
            }
        }
        this.image.updatePixels()

        this.value = value
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

class Player extends Sprite {

    constructor() {
        super('cloud')
        this.source = images['cloud_source']
        this.source.loadPixels()
        this.image.loadPixels()

        this.scale = .06

        this.speed = 3
        this.distance = 150
        this.targets = [null, null, null]
        this.softness = 1
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
               friend.pos_vec.dist(this.pos_vec) < 22) {
                if(friend.value > this.softness) {
                    friend.shatter()
                } else {
                    friend.get_caught()
                }
            }
        })

        game.cookies.forEach((cookie) => {
            if(cookie.pos_vec.dist(this.pos_vec) < 12) {
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
                    this.image.pixels[i] = this.source.pixels[i+1] - Math.ceil((this.softness - 1) * 8)
                    this.image.pixels[i+1] = this.source.pixels[i+1] - Math.ceil((this.softness - 1) * 100)
                }
            }
            this.image.updatePixels()
            this.image.mask(images["cloud_mask"])
            this.prev_softness = this.softness
        }
        
        super.draw()
        circle(this.center_x, this.center_y, 22)
    }
}

document.oncontextmenu = function() {
    return false;
}

function mousePressed(e) {

    if(game.paused) {
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
    if(!game.muted) {
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
    }

    sounds = {
        "shatter": loadSound("sounds/shatter.wav"),
        "chomp": loadSound("sounds/chomp.wav")
    }

}

function setup() {
    size = 700
    boardsize = 600
    framerate = 45
    textAlign(CENTER, CENTER)
    frameRate(framerate)
    noStroke()
    centerpoint =createVector(size/2, size/2)
    bgcolor = color(148,201,61)

    game = new Game()
    game.setup()

    let width = size
    let height = width
    createCanvas(width, height)

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
        this.friend_rate = .9
        this.cookie_rate = .9
        this.friend_count = 0
        this.paused = false
        this.muted = false
        this.score = 0
        this.player = new Player()
        this.friends = []
        this.friend_timer = framerate * this.friend_rate
        this.cookies = []
        this.cookie_timer = framerate * this.cookie_rate
        this.animations = []
    }

    setup() {
        
    }

    async on_key_release(k) {
        if(k == 80) { //p
            this.paused = !this.paused
        } else if(k == 77) { //m
            this.muted = !this.muted
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
    }
        

    draw() {
        background(245, 162, 228)
        noFill()
        stroke(0,0,0)
        circle(centerpoint.x, centerpoint.y, boardsize)

        this.friends = this.friends.filter(friend => !friend.dead)
        if(this.friend_timer > 0) {
            this.friend_timer -= 1
        } else {
            this.friend_count += 1
            var value = randrange(2, this.friend_count % 3)
            this.friends.push(new Friend(5, value))
            this.friend_timer = framerate * this.friend_rate
            this.friend_rate += .07
        }

        this.cookies = this.cookies.filter(cookie => !cookie.dead)
        if(this.cookie_timer > 0) {
            this.cookie_timer -= 1
        } else {
            this.cookies.push(choice([new Soft()]))//, new Fast(), new Short()]))

            this.cookie_timer = framerate * this.cookie_rate
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
        this.player.draw()

        text(this.score, centerpoint.x + boardsize/2 + 30, 75)
    }
}
