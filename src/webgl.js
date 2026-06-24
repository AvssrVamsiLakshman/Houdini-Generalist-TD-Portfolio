export class WebGLController {
  constructor(webglCanvasId) {
    this.webglCanvas = document.getElementById(webglCanvasId) || document.createElement('div');
    
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

    // Set initial overlay color
    this.setMode('HERO');

    // Setup scroll tracking for background horizontal parallax shift
    this.currentScrollY = window.scrollY;
    this.updateScrollShift();
    
    window.addEventListener('scroll', () => {
      this.currentScrollY = window.scrollY;
      this.updateScrollShift();
    });
    window.addEventListener('resize', () => {
      this.updateScrollShift();
    });
  }

  updateScrollShift() {
    const width = window.innerWidth;
    // Follow a smooth cosine wave alternating right/left
    // y = 0: shift +maxShift (right)
    // y = 1500 (Modeling): shift -maxShift (left)
    // Period is roughly 3000px, which corresponds to frequency = Math.PI / 1500 = 0.00209
    const maxShift = width * 0.24;
    const shiftX = Math.cos(this.currentScrollY * 0.0021) * maxShift;
    
    const wrapper = document.getElementById('gif-bg-scroller-wrapper');
    if (wrapper) {
      wrapper.style.transform = `translate3d(${shiftX}px, 0, 0)`;
    }
  }

  updateSectionBounds() {}

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

  animate() {}

  renderMatrixRain() {}
}
