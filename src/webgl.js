export class WebGLController {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    // Simulation parameters
    this.simSpeed = 1.0;
    this.fontSizeMin = 9;
    this.fontSizeMax = 18;

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));

    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.initMatrix();
  }

  initMatrix() {
    const columnWidth = 16;
    this.columnsCount = Math.floor(this.width / columnWidth) + 1;
    this.columns = [];

    for (let i = 0; i < this.columnsCount; i++) {
      this.columns.push({
        x: i * columnWidth,
        y: Math.random() * -this.height * 1.5, // stagger start positions above screen
        speed: (Math.random() * 4 + 2) * this.simSpeed,
        fontSize: Math.floor(Math.random() * (this.fontSizeMax - this.fontSizeMin)) + this.fontSizeMin,
        opacity: Math.random() * 0.4 + 0.5
      });
    }
  }

  setMode(mode) {
    // Dynamically adjust speed based on website sections for interactive visual feedback
    if (mode === 'DOP') {
      this.simSpeed = 1.8; // fast motion for dynamics
    } else if (mode === 'LOP') {
      this.simSpeed = 0.8; // slower, procedural lookdev flow
    } else if (mode === 'TOP') {
      this.simSpeed = 1.4; // fast compiler run speed
    } else {
      this.simSpeed = 1.0; // default SOP/Hero speed
    }

    if (this.columns) {
      this.columns.forEach(col => {
        col.speed = (Math.random() * 4 + 2) * this.simSpeed;
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Clear with semi-transparent dark charcoal gray to create beautiful fading tails
    // Matches the custom portfolio slate-gray color palette (#16171a)
    this.ctx.fillStyle = 'rgba(22, 23, 26, 0.09)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';

    this.columns.forEach(col => {
      this.ctx.font = `${col.fontSize}px 'JetBrains Mono', monospace`;

      // Generate binary character
      const char = Math.random() > 0.5 ? '1' : '0';

      // 1. Draw glowing head character at the bottom of the active drop
      this.ctx.fillStyle = `rgba(255, 210, 180, ${col.opacity})`; // Glowing peach/light orange
      this.ctx.shadowColor = '#ff6a00';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(char, col.x, col.y);

      // 2. Draw normal body character slightly behind the head
      this.ctx.shadowBlur = 0; // disable shadow for body to optimize performance
      this.ctx.fillStyle = `rgba(255, 106, 0, ${col.opacity * 0.8})`; // Houdini Orange body
      this.ctx.fillText(char, col.x, col.y - col.fontSize);

      // Advance column position down the viewport
      col.y += col.speed;

      // Reset drop when it reaches the bottom of the viewport
      if (col.y > this.height + 50) {
        col.y = Math.random() * -150 - 20;
        col.speed = (Math.random() * 4 + 2) * this.simSpeed;
        col.fontSize = Math.floor(Math.random() * (this.fontSizeMax - this.fontSizeMin)) + this.fontSizeMin;
        col.opacity = Math.random() * 0.4 + 0.5;
      }
    });
  }
}
