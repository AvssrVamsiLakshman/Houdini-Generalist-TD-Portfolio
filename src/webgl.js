import gifUrl from './black-white-art.gif';

export class WebGLController {
  constructor(webglCanvasId) {
    this.webglCanvas = document.getElementById(webglCanvasId) || document.createElement('div');
    
    // Create container for flowing GIF particles
    this.bgContainer = document.createElement('div');
    this.bgContainer.id = 'gif-bg-container';
    this.bgContainer.style.position = 'fixed';
    this.bgContainer.style.top = '0';
    this.bgContainer.style.left = '0';
    this.bgContainer.style.width = '100vw';
    this.bgContainer.style.height = '100vh';
    this.bgContainer.style.zIndex = '1';
    this.bgContainer.style.pointerEvents = 'none';
    this.bgContainer.style.overflow = 'hidden';
    document.body.appendChild(this.bgContainer);

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
    this.transformMode = 'translate';

    this.themeColors = {
      HERO: { r: 255, g: 133, b: 0 },
      SOP: { r: 69, g: 179, b: 227 },
      DOP: { r: 46, g: 204, b: 113 },
      COP: { r: 241, g: 196, b: 15 },
      VOP: { r: 224, g: 86, b: 253 },
      LOP: { r: 0, g: 210, b: 211 },
      APEX: { r: 95, g: 39, b: 205 },
      CHOP: { r: 38, g: 222, b: 129 },
      TOOLDEV: { r: 255, g: 71, b: 87 },
      CROWD: { r: 165, g: 94, b: 234 },
      CFX: { r: 255, g: 118, b: 117 },
      GROOM: { r: 236, g: 204, b: 104 }
    };

    this.particles = [];
    this.sectionBounds = [];
    this.currentScrollY = window.scrollY;

    // Load bounds & start simulation
    this.updateSectionBounds();
    window.addEventListener('scroll', () => {
      this.currentScrollY = window.scrollY;
      this.updateSectionBounds();
    });
    window.addEventListener('resize', () => {
      this.updateSectionBounds();
    });
    window.addEventListener('load', () => {
      this.updateSectionBounds();
    });

    this.animate();
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

  updateAvoidBounds() {}

  resize() {}

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

  spawnParticle() {
    const size = 60 + Math.random() * 80;
    const p = {
      el: document.createElement('img'),
      y: -150,
      speed: 0.8 + Math.random() * 1.5,
      size,
      pathType: Math.floor(Math.random() * 3),
      phase: Math.random() * Math.PI * 2,
      opacity: 0.12 + Math.random() * 0.18,
      lastSectionIndex: 0
    };

    p.el.src = gifUrl;
    p.el.style.position = 'absolute';
    p.el.style.width = `${size}px`;
    p.el.style.height = `${size}px`;
    p.el.style.objectFit = 'contain';
    p.el.style.pointerEvents = 'none';
    p.el.style.willChange = 'transform, opacity, filter';
    
    this.bgContainer.appendChild(p.el);
    this.particles.push(p);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderMatrixRain();
  }

  renderMatrixRain() {
    if (!this.displayRain) {
      this.particles.forEach(p => p.el.remove());
      this.particles = [];
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scrollY = this.currentScrollY;

    // Spawn new particles to maintain density
    if (this.particles.length < 20 && Math.random() > 0.96) {
      this.spawnParticle();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speed;

      let x = 0;
      const t = p.y / height;

      // S-shape paths mapping exactly to drawings
      if (p.pathType === 0) {
        // Path A: Flows from top-right, curves left under center, curves right towards bottom
        const baseX = width * (0.8 - 0.6 * Math.sin(t * Math.PI));
        x = baseX + Math.sin(p.y * 0.005 + p.phase) * 50;
      } else if (p.pathType === 1) {
        // Path B: Flows from top-left, curves right under center, curves left towards bottom
        const baseX = width * (0.2 + 0.6 * Math.sin(t * Math.PI));
        x = baseX + Math.sin(p.y * 0.005 + p.phase) * 50;
      } else {
        // Path C: Central deep S-curve flow
        const baseX = width * 0.5 + Math.sin(t * Math.PI * 0.5) * 80;
        x = baseX + Math.sin(p.y * 0.003 + p.phase) * 150;
      }

      // Determine Section Mode for coloring based on absolute vertical offset
      const absoluteY = p.y + scrollY;
      let matchedMode = 'HERO';
      let lastIdx = p.lastSectionIndex || 0;
      if (lastIdx >= this.sectionBounds.length) lastIdx = 0;

      if (this.sectionBounds.length > 0) {
        const section = this.sectionBounds[lastIdx];
        if (absoluteY >= section.top && absoluteY <= section.bottom) {
          matchedMode = section.mode;
        } else {
          let found = false;
          for (let s = 0; s < this.sectionBounds.length; s++) {
            const sec = this.sectionBounds[s];
            if (absoluteY >= sec.top && absoluteY <= sec.bottom) {
              matchedMode = sec.mode;
              p.lastSectionIndex = s;
              found = true;
              break;
            }
          }
          if (!found) {
            matchedMode = 'HERO';
            p.lastSectionIndex = 0;
          }
        }
      }

      // Check bypass flag for active mode
      if (this.bypassFlags[matchedMode]) {
        p.el.style.opacity = '0';
      } else {
        const color = this.themeColors[matchedMode] || this.themeColors.HERO;
        p.el.style.transform = `translate3d(${x - p.size / 2}px, ${p.y}px, 0)`;
        p.el.style.opacity = p.opacity;
        p.el.style.filter = `drop-shadow(0 0 15px rgb(${color.r}, ${color.g}, ${color.b})) brightness(1.2)`;
      }

      // Remove offscreen particles
      if (p.y > height + 100) {
        p.el.remove();
        this.particles.splice(i, 1);
      }
    }
  }
}
