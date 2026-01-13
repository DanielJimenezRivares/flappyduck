class Bird {
    static image = new Image();
    static soundFlap = new Audio('assets/wing-flap.mp3');

    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 8;
        this.y = canvasHeight / 2;
        this.width = canvasWidth / 15;
        this.height = canvasWidth / 15;
        this.velocity = 0;
        
        this.gravity = 1000; // "Fuerza de gravedad" (px/s^2)
        this.jumpStrength = -300; // "Fuerza de salto" (px/s)
    }

    update(dt) {
        this.velocity += this.gravity * dt;
        this.y += this.velocity * dt;
    }

    jump() {
        this.velocity = this.jumpStrength;
        Bird.soundFlap.currentTime = 0.1;
        Bird.soundFlap.play();
    }

    draw(ctx) {
        ctx.drawImage(Bird.image, this.x, this.y, this.width, this.height);
    }
}

class Pipe {
    constructor(canvasWidth, canvasHeight, gameSpeed) {
        this.x = canvasWidth;
        this.width = canvasWidth / 8;
        this.gap = canvasHeight / 5;
        this.topY = Math.random() * (canvasHeight - this.gap - 2*canvasHeight/8) + canvasHeight/8;
        this.bottomY = this.topY + this.gap;
        this.capHeight = 20;
        this.capOverhang = 4;
        this.passed = false;
        this.canvasHeight = canvasHeight;

        this.speed = gameSpeed;  // VELOCIDAD: Píxeles por segundo
    }

    update(dt) {
        this.x -= this.speed * dt;
    }

    draw(ctx) {
        ctx.fillStyle = "#228B22";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        // --- TUBO DE ARRIBA ---
        ctx.fillRect(this.x, 0, this.width, this.topY);
        ctx.strokeRect(this.x, 0, this.width, this.topY);
        ctx.fillRect(this.x - this.capOverhang, this.topY - this.capHeight, this.width + (this.capOverhang*2), this.capHeight);
        ctx.strokeRect(this.x - this.capOverhang, this.topY - this.capHeight, this.width + (this.capOverhang*2), this.capHeight);

        // --- TUBO DE ABAJO ---
        ctx.fillRect(this.x, this.bottomY, this.width, this.canvasHeight);
        ctx.strokeRect(this.x, this.bottomY, this.width, this.canvasHeight);
        ctx.fillRect(this.x - this.capOverhang, this.bottomY, this.width + (this.capOverhang*2), this.capHeight);
        ctx.strokeRect(this.x - this.capOverhang, this.bottomY, this.width + (this.capOverhang*2), this.capHeight);

        // Brillo
        ctx.fillStyle = "#55a855";
        ctx.fillRect(this.x + 5, 0, 4, this.topY - this.capHeight);
        ctx.fillRect(this.x + 5, this.bottomY + this.capHeight, 4, 600);
    }
}

class Game {
    constructor(canvasId) {
        /** @type {HTMLCanvasElement} */
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // ESTADOS: 'START', 'PLAYING', 'CRASHED', 'GAMEOVER'
        this.state = 'START';
        this.needsRedraw = true;
        this.lastTime = 0;
        
        this.score = 0;
        this.bird = new Bird(this.canvas.width, this.canvas.height);
        this.pipes = [];
        this.timeSinceLastPipe = 0;
        this.gameSpeed = 150;      
        this.maxSpeed = 250;
        this.pipeSpawnRate = 1.5;
        this.minPipeSpawnRate = 0.75;
        this.difficultyTimer = 0;

        this.soundPoint = new Audio('assets/ding.mp3');
        this.soundCrash = new Audio('assets/crash.mp3');
        this.soundPoint.volume = 0.1;

        const loadImage = new Promise((resolve) => {
            Bird.image.onload = () => {
                resolve();
            };
            Bird.image.src = 'assets/duck.png';
        });

        const loadFont = document.fonts.load('10px "Press Start 2P"');

        Promise.all([loadImage, loadFont]).then(() => {
            this.initInput();
            this.gameloop(0);
        });
    }

    resize() {
        const gameWidth = this.canvas.width;
        const gameHeight = this.canvas.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scaleX = windowWidth / gameWidth;
        const scaleY = windowHeight / gameHeight;
        const scale = Math.min(scaleX, scaleY);
        this.canvas.style.width = (gameWidth * scale) + "px";
        this.canvas.style.height = (gameHeight * scale) + "px";
    }

    reset() {
        this.lastTime = 0;
        this.score = 0;
        this.bird = new Bird(this.canvas.width, this.canvas.height);
        this.pipes = [];
        this.timeSinceLastPipe = 0;
        this.gameSpeed = 150;
        this.pipeSpawnRate = 1.5;
        this.difficultyTimer = 0;
    }

    initInput() {
        const handleAction = () => {
            // 1. Si estamos en el MENÚ -> Empezar a jugar
            if (this.state === 'START') {
                this.state = 'PLAYING';
                this.bird.jump();
            } 
            // 2. Si estamos JUGANDO -> Saltar
            else if (this.state === 'PLAYING') {
                this.bird.jump();
            } 
            // 3. Si es GAME OVER -> Reiniciar (Input del usuario para volver)
            else if (this.state === 'GAMEOVER') {
                this.state = 'START';
                this.reset();
            }
            
            this.needsRedraw = true;
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleAction();
            }
        });
        this.canvas.addEventListener('mousedown', handleAction);
    }

    update(dt) {
        if (this.state === 'PLAYING') {
            // Cada 10 segundos aumentamos la velocidad
            this.difficultyTimer += dt;
            if (this.difficultyTimer > 5) {
                this.difficultyTimer = 0;
                if (this.gameSpeed < this.maxSpeed) {
                    this.gameSpeed += 5;
                    this.pipes.forEach(pipe => pipe.speed = this.gameSpeed);
                }
                if (this.pipeSpawnRate > this.minPipeSpawnRate) {
                    this.pipeSpawnRate -= 0.025;
                }
                console.log("¡Nivel Subido! Velocidad: " + this.gameSpeed + " px/s | Intervalo de generación: " + this.pipeSpawnRate.toFixed() + "s");
            }
            
            this.timeSinceLastPipe += dt;
            if (this.timeSinceLastPipe > this.pipeSpawnRate) {
                this.pipes.push(new Pipe(this.canvas.width, this.canvas.height, this.gameSpeed));
                this.timeSinceLastPipe = 0;
            }

            this.pipes.forEach(pipe => pipe.update(dt));
            this.bird.update(dt);

            while (this.pipes.length > 0) {
                if (this.pipes[0].x + this.pipes[0].width < 0) {
                    this.pipes.shift();
                }
                else {
                    break;
                }
            }

            for (const pipe of this.pipes) {
                if (pipe.passed) {
                    continue; 
                }
                else if (this.bird.x > pipe.x + pipe.width) {
                    this.score++;
                    pipe.passed = true;
                    this.soundPoint.currentTime = 0;
                    this.soundPoint.play();
                } 
                else {
                    break;
                }
            }

            this.checkCollisions();
            this.needsRedraw = true;
        }
    }

    checkCollisions() {
        // 1. Borde superior e inferior
        if (this.bird.y + this.bird.height >= this.canvas.height || this.bird.y < 0) {
            this.handleCrash();
        }

        // 2. Tuberías
        // Usamos AABB (Axis-Aligned Bounding Box)
        for (const pipe of this.pipes) {
                // CASO A: Tubería FUTURA (A la derecha del pájaro)
                if (pipe.x > this.bird.x + this.bird.width) {
                    break;
                }
                // CASO B: Tubería PASADA (A la izquierda del pájaro)
                if (pipe.x + pipe.width < this.bird.x) {
                    continue;
                }
                // CASO C: ZONA DE COLISIÓN (Estamos alineados horizontalmente)
                if (this.bird.y < pipe.topY || this.bird.y + this.bird.height > pipe.bottomY) {
                    this.handleCrash();
                    break; // Ya nos matamos, no hace falta seguir.
                }
            }
    }

    handleCrash() {
        this.state = 'CRASHED';
        this.soundCrash.currentTime = 0.3;
        this.soundCrash.play();
        setTimeout(() => {
            this.state = 'GAMEOVER';
            this.needsRedraw = true;
        }, 500);
    }

    draw() {
        if (this.needsRedraw) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.pipes.forEach(p => p.draw(this.ctx));
            this.bird.draw(this.ctx);
            this.drawUI();
            if (this.state !== 'PLAYING') {
                this.needsRedraw = false;
            }
        }
    }

    drawUI() {
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3; // Borde más grueso para estilo retro
        const maxWidth = this.canvas.width - 20;

        // Puntuación
        this.ctx.font = "40px 'Press Start 2P";
        this.ctx.fillText(this.score, this.canvas.width / 2, 80);
        this.ctx.strokeText(this.score, this.canvas.width / 2, 80);

        if (this.state === 'START') {
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "40px 'Press Start 2P'";
            this.ctx.fillText("FLAPPY DUCK", this.canvas.width / 2, this.canvas.height / 2 - 40, maxWidth);
            this.ctx.strokeText("FLAPPY DUCK", this.canvas.width / 2, this.canvas.height / 2 - 40, maxWidth);
            
            this.ctx.font = "30px 'Press Start 2P'";
            this.ctx.fillText("CLICK TO START", this.canvas.width / 2, this.canvas.height / 2 + 100, maxWidth);
            this.ctx.strokeText("CLICK TO START", this.canvas.width / 2, this.canvas.height / 2 + 100, maxWidth);
        } 
        
        else if (this.state === 'CRASHED' || this.state === 'GAMEOVER') {
            this.ctx.fillStyle = "#FF4444";
            this.ctx.font = "50px 'Press Start 2P";
            
            this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2, maxWidth);
            this.ctx.strokeText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2, maxWidth);
        }
        
        if (this.state === 'GAMEOVER') {
             this.ctx.fillStyle = "white";
             this.ctx.font = "30px 'Press Start 2P";
             this.ctx.fillText("CLICK TO RESTART", this.canvas.width / 2, this.canvas.height / 2 + 50, maxWidth);
             this.ctx.strokeText("CLICK TO RESTART", this.canvas.width / 2, this.canvas.height / 2 + 50, maxWidth);
        }
    }

    gameloop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTimeMs = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Convertir a segundos
        const dt = deltaTimeMs / 1000;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.gameloop(ts));
    }
}

// Arranque
window.onload = () => new Game('gameCanvas');
