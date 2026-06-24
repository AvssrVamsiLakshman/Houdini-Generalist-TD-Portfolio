export class WebGLController {
  constructor(webglCanvasId) {
    this.webglCanvas = document.getElementById(webglCanvasId);
    this.matrixCanvas = document.getElementById('matrix-canvas');
    if (!this.matrixCanvas) return;

    // Simulation & interaction parameters (preserved for main.js compatibility)
    this.vexParams = { frequency: 7.5, amplitude: 0.9, speed: 2.0 };
    this.sopParams = { extrude: 1.6, radius: 3.0 };
    this.dopParams = { turbulence: 2.25, wind: 1.8 };
    this.bypassFlags = {
      SOP: false, DOP: false, COP: false, VOP: false, LOP: false,
      APEX: false, CHOP: false, TOOLDEV: false, CROWD: false, CFX: false, GROOM: false
    };

    this.displayGrid = true;
    this.displayRain = true;
    this.activeMode = 'HERO';

    // Color theme values
    this.themeColors = {
      HERO: { r: 255, g: 133, b: 0 },    // Orange/Gold (OBJ)
      SOP: { r: 69, g: 179, b: 227 },     // Pale Teal/Blue (SOP)
      DOP: { r: 46, g: 204, b: 113 },     // Dark/Forest Green (DOP)
      COP: { r: 241, g: 196, b: 15 },     // Mustard/Bright Yellow (COP)
      VOP: { r: 224, g: 86, b: 253 },     // Pink/Magenta (VOP)
      LOP: { r: 0, g: 210, b: 211 },      // Cyan/Teal/Light Sky Blue (LOP)
      APEX: { r: 95, g: 39, b: 205 },     // Indigo/Medium Blue (APEX)
      CHOP: { r: 38, g: 222, b: 129 },    // Lime/Bright Green (CHOP)
      TOOLDEV: { r: 255, g: 71, b: 87 },   // Dark Red/Burgundy (PDG/TOOLDEV)
      CROWD: { r: 165, g: 94, b: 234 },   // Deep Orchid/Violet (CROWD)
      CFX: { r: 255, g: 118, b: 117 },     // Salmon/Coral (CFX)
      GROOM: { r: 236, g: 204, b: 104 }    // Warm Amber/Gold (GROOM)
    };

    // Mouse coordinates tracker
    this.mouseX = 0;
    this.mouseY = 0;

    // Initialize caching for section coordinates
    this.currentScrollY = window.scrollY;
    this.sectionBounds = [];
    this.avoidBounds = [];

    // Initialize systems
    this.initMatrix();
    this.resize();

    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    window.addEventListener('scroll', () => {
      this.currentScrollY = window.scrollY;
      this.updateSectionBounds();
    });

    window.addEventListener('load', () => {
      this.updateSectionBounds();
      this.updateAvoidBounds();
    });

    this.animate();
  }

  initMatrix() {
    this.matrixCtx = this.matrixCanvas.getContext('2d');
    this.matrixColumns = [];

    // Monospace Matrix tokens (VEX script parts, Katakana, variables, numbers)
    this.tokens = [
      'v@P', 'v@N', 'v@v', 'f@radius', 'f@age', 'f@life', 'i@id', 'chf()', 'chv()', 'chi()', 'chp()',
      'attribwrangle', 'pointwrangle', 'setpointattrib', 'addpoint', 'pcopen', 'noise', 'curlnoise',
      'fit', 'clamp', 'normalize', 'cross', 'dot', 'length', 'distance', 'vector', 'matrix', 'float',
      'int', 'string', 'struct', 'import', 'SOP', 'DOP', 'LOP', 'VOP', 'TOP', 'CHOP', 'ROP', 'COP',
      'APEX', 'KINEFX', 'SOLVER', 'NET', 'ASSET', 'karma', 'mantra', 'materialx', 'pyside', 'hda',
      'ｦ', 'ｧ', 'ｨ', 'ｩ', 'ｪ', 'ｫ', 'ｬ', 'ｭ', 'ｮ', 'ｯ', 'ｰ', 'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ',
      'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', 'ﾀ', 'ﾁ', 'ﾂ', 'ﾃ', 'ﾄ', 'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾉ',
      '∑', '√', '∫', '∂', 'θ', 'λ', 'π', '∞', '×', '÷', 'Δ', 'Ω', '0', '1', '0', '1'
    ];
  }

  updateSectionBounds() {
    const sectionEls = document.querySelectorAll('section[id]');
    this.sectionBounds = Array.from(sectionEls).map(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const mode = section.getAttribute('data-mode') || 'HERO';
      return {
        top,
        bottom: top + height,
        mode
      };
    });

    const footer = document.querySelector('footer');
    if (footer) {
      const top = footer.offsetTop;
      const height = footer.offsetHeight;
      this.sectionBounds.push({
        top,
        bottom: top + height,
        mode: 'TOOLDEV'
      });
    }
  }

  updateAvoidBounds() {
    const avoidElements = document.querySelectorAll('.hero-card, .video-card');
    this.avoidBounds = Array.from(avoidElements).map(el => {
      const rect = el.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      return {
        left: rect.left + scrollX - 8,
        right: rect.right + scrollX + 8,
        top: rect.top + scrollY - 8,
        bottom: rect.bottom + scrollY + 8
      };
    });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Resize Matrix 2D canvas
    this.matrixCanvas.width = this.width;
    this.matrixCanvas.height = this.height;

    // Seamlessly update Matrix digital rain columns - increased density
    const columnWidth = 2;
    const columnsCount = Math.floor(this.width / columnWidth) + 1;

    if (this.matrixColumns.length < columnsCount) {
      const start = this.matrixColumns.length;
      for (let i = start; i < columnsCount; i++) {
        const speedFactor = 0.8 + Math.random() * 0.4;
        this.matrixColumns.push({
          x: i * columnWidth,
          y: Math.random() * -this.height * 1.5,
          speedFactor: speedFactor,
          speed: (this.height / 3600) * speedFactor,
          opacity: Math.random() * 0.4 + 0.6,
          fontSize: Math.floor(Math.random() * 6) + 10,
          tokenIndex: Math.floor(Math.random() * this.tokens.length)
        });
      }
    } else if (this.matrixColumns.length > columnsCount) {
      this.matrixColumns.splice(columnsCount);
    }

    this.matrixColumns.forEach((col, idx) => {
      col.x = idx * columnWidth;
      col.speed = (this.height / 3600) * col.speedFactor;
    });

    this.updateSectionBounds();
    this.updateAvoidBounds();
  }

  onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  setMode(mode) {
    this.activeMode = mode;

    // Update HUD elements on screen
    const pathText = document.getElementById('hud-obj-path');
    const solverText = document.getElementById('hud-active-solver');

    if (pathText) {
      let path = '/obj';
      if (mode === 'SOP') path = '/obj/geo1/modeling_sop';
      else if (mode === 'DOP') path = '/obj/dynamics_dopnet1/pyrosolver1';
      else if (mode === 'COP') path = '/img/img1/copernicus_texture1';
      else if (mode === 'VOP') path = '/mat/materialx_lookdev1';
      else if (mode === 'LOP') path = '/stage/solaris_usd_lighting1';
      else if (mode === 'APEX') path = '/obj/apex_character_rig1';
      else if (mode === 'CHOP') path = '/ch/mocap_channels1';
      else if (mode === 'TOOLDEV') path = '/tasks/tooldev_pdgnet1';
      else if (mode === 'CROWD') path = '/obj/crowd_simulation1/crowdsolver1';
      else if (mode === 'CFX') path = '/obj/vellum_character_fx1/vellumsolver1';
      else if (mode === 'GROOM') path = '/obj/hair_groom1/guidegroom1';

      pathText.textContent = path;
    }

    if (solverText) {
      solverText.textContent = `${mode}_SOLVER`;
      solverText.className = '';
      const hexColor = (mode === 'HERO') ? '#ff8500' :
        (mode === 'SOP') ? '#45b3e3' :
          (mode === 'DOP') ? '#2ecc71' :
            (mode === 'COP') ? '#f1c40f' :
              (mode === 'VOP') ? '#e056fd' :
                (mode === 'LOP') ? '#00d2d3' :
                  (mode === 'APEX') ? '#5f27cd' :
                    (mode === 'CHOP') ? '#26de81' :
                      (mode === 'TOOLDEV') ? '#ff4757' :
                        (mode === 'CROWD') ? '#a55eea' :
                          (mode === 'CFX') ? '#ff7675' :
                            (mode === 'GROOM') ? '#eccc68' : '#ff8500';
      solverText.style.color = hexColor;
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderMatrixRain();
  }

  renderMatrixRain() {
    this.matrixCtx.fillStyle = 'rgba(10, 11, 13, 0.08)';
    this.matrixCtx.fillRect(0, 0, this.width, this.height);

    if (!this.displayRain) return;

    this.matrixCtx.textAlign = 'left';

    this.matrixColumns.forEach((col) => {
      const char = this.tokens[col.tokenIndex];

      const absoluteY = col.y + this.currentScrollY;
      let matchedColor = this.themeColors.HERO;
      for (const section of this.sectionBounds) {
        if (absoluteY >= section.top && absoluteY <= section.bottom) {
          matchedColor = this.themeColors[section.mode] || this.themeColors.HERO;
          break;
        }
      }
      const r = Math.round(matchedColor.r);
      const g = Math.round(matchedColor.g);
      const b = Math.round(matchedColor.b);

      let headDeflection = 0;
      const headAbsoluteY = col.y + this.currentScrollY;

      for (const bound of this.avoidBounds) {
        let deflection = 0;
        const centerX = (bound.left + bound.right) / 2;
        const margin = 12;
        let yWeight = 0;
        const yBuffer = 90;

        if (headAbsoluteY >= bound.top - yBuffer && headAbsoluteY < bound.top) {
          yWeight = (headAbsoluteY - (bound.top - yBuffer)) / yBuffer;
          yWeight = Math.sin(yWeight * Math.PI / 2);
        } else if (headAbsoluteY >= bound.top && headAbsoluteY <= bound.bottom) {
          yWeight = 1;
        } else if (headAbsoluteY > bound.bottom && headAbsoluteY <= bound.bottom + yBuffer) {
          yWeight = 1 - (headAbsoluteY - bound.bottom) / yBuffer;
          yWeight = Math.sin(yWeight * Math.PI / 2);
        }

        if (yWeight > 0) {
          if (col.x < centerX) {
            const targetX = bound.left - margin;
            if (col.x > targetX) {
              deflection = (targetX - col.x) * yWeight;
            }
          } else {
            const targetX = bound.right + margin;
            if (col.x < targetX) {
              deflection = (targetX - col.x) * yWeight;
            }
          }
        }

        if (Math.abs(deflection) > Math.abs(headDeflection)) {
          headDeflection = deflection;
        }
      }

      const headDeflectedX = col.x + headDeflection;

      const headDx = headDeflectedX - this.mouseX;
      const headDy = col.y - this.mouseY;
      const headDist = Math.sqrt(headDx * headDx + headDy * headDy);

      let headOffsetX = 0;
      let headFontScale = 1;

      if (headDist < 120) {
        headOffsetX = (120 - headDist) * 0.3 * (headDx > 0 ? 1 : -1);
        headFontScale = 1 + (120 - headDist) * 0.003;
      }

      this.matrixCtx.font = `${Math.floor(col.fontSize * headFontScale)}px 'JetBrains Mono', monospace`;
      const finalHeadX = headDeflectedX + headOffsetX;

      let drawHead = true;
      for (const bound of this.avoidBounds) {
        if (finalHeadX >= bound.left && finalHeadX <= bound.right &&
          headAbsoluteY >= bound.top && headAbsoluteY <= bound.bottom) {
          drawHead = false;
          break;
        }
      }

      if (drawHead) {
        this.matrixCtx.fillStyle = `rgba(255, 255, 255, ${col.opacity * 0.95})`;
        this.matrixCtx.shadowBlur = 6;
        this.matrixCtx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        this.matrixCtx.fillText(char, finalHeadX, col.y);
      }

      const trailLength = 5;
      for (let j = 1; j <= trailLength; j++) {
        const trailOffset = j * col.fontSize;
        const trailAbsoluteY = col.y - trailOffset + this.currentScrollY;

        let trailDeflection = 0;
        for (const bound of this.avoidBounds) {
          let deflection = 0;
          const centerX = (bound.left + bound.right) / 2;
          const margin = 12;
          let yWeight = 0;
          const yBuffer = 90;

          if (trailAbsoluteY >= bound.top - yBuffer && trailAbsoluteY < bound.top) {
            yWeight = (trailAbsoluteY - (bound.top - yBuffer)) / yBuffer;
            yWeight = Math.sin(yWeight * Math.PI / 2);
          } else if (trailAbsoluteY >= bound.top && trailAbsoluteY <= bound.bottom) {
            yWeight = 1;
          } else if (trailAbsoluteY > bound.bottom && trailAbsoluteY <= bound.bottom + yBuffer) {
            yWeight = 1 - (trailAbsoluteY - bound.bottom) / yBuffer;
            yWeight = Math.sin(yWeight * Math.PI / 2);
          }

          if (yWeight > 0) {
            if (col.x < centerX) {
              const targetX = bound.left - margin;
              if (col.x > targetX) {
                deflection = (targetX - col.x) * yWeight;
              }
            } else {
              const targetX = bound.right + margin;
              if (col.x < targetX) {
                deflection = (targetX - col.x) * yWeight;
              }
            }
          }

          if (Math.abs(deflection) > Math.abs(trailDeflection)) {
            trailDeflection = deflection;
          }
        }

        const trailDeflectedX = col.x + trailDeflection;

        const trailDx = trailDeflectedX - this.mouseX;
        const trailDy = (col.y - trailOffset) - this.mouseY;
        const trailDist = Math.sqrt(trailDx * trailDx + trailDy * trailDy);

        let trailOffsetX = 0;
        let trailFontScale = 1;

        if (trailDist < 120) {
          trailOffsetX = (120 - trailDist) * 0.3 * (trailDx > 0 ? 1 : -1);
          trailFontScale = 1 + (120 - trailDist) * 0.003;
        }

        const finalTrailX = trailDeflectedX + trailOffsetX;

        let drawTrail = true;
        for (const bound of this.avoidBounds) {
          if (finalTrailX >= bound.left && finalTrailX <= bound.right &&
            trailAbsoluteY >= bound.top && trailAbsoluteY <= bound.bottom) {
            drawTrail = false;
            break;
          }
        }

        if (drawTrail) {
          this.matrixCtx.shadowBlur = 0;
          const trailOpacity = col.opacity * (0.6 - (j / trailLength) * 0.5);
          this.matrixCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailOpacity})`;
          this.matrixCtx.font = `${Math.floor(col.fontSize * trailFontScale)}px 'JetBrains Mono', monospace`;

          const trailTokenIndex = (col.tokenIndex + j) % this.tokens.length;
          const trailChar = this.tokens[trailTokenIndex];
          this.matrixCtx.fillText(trailChar, finalTrailX, col.y - trailOffset);
        }
      }

      col.y += col.speed;

      if (Math.random() > 0.95) {
        col.tokenIndex = Math.floor(Math.random() * this.tokens.length);
      }

      if (col.y > this.height + 120) {
        col.y = Math.random() * -120 - 20;
        col.speedFactor = 0.8 + Math.random() * 0.4;
        col.speed = (this.height / 3600) * col.speedFactor;
        col.opacity = Math.random() * 0.4 + 0.6;
        col.tokenIndex = Math.floor(Math.random() * this.tokens.length);
      }
    });
  }
}
