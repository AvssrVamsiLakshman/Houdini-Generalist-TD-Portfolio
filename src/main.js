import './style.css';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  // Cache UI elements
  const loader = document.getElementById('loader');
  const loaderBar = loader?.querySelector('.loader-bar');
  const loaderStatus = loader?.querySelector('.loader-status');
  const logContainer = loader?.querySelector('.loader-log');
  
  const sections = document.querySelectorAll('section[id]');
  const contactForm = document.getElementById('visitor-contact-form');

  let activeSection = 'hero';
  let activeMode = 'HERO';

  const themeColors = {
    HERO: 'rgb(255, 133, 0)',
    SOP: 'rgb(69, 179, 227)',
    DOP: 'rgb(46, 204, 113)',
    COP: 'rgb(241, 196, 15)',
    VOP: 'rgb(224, 86, 253)',
    LOP: 'rgb(0, 210, 211)',
    APEX: 'rgb(95, 39, 205)',
    CHOP: 'rgb(38, 222, 129)',
    TOOLDEV: 'rgb(255, 71, 87)',
    CROWD: 'rgb(165, 94, 234)',
    CFX: 'rgb(255, 118, 117)',
    GROOM: 'rgb(236, 204, 104)'
  };

  // --- Initialize CSS Matrix Digital Rain ---
  const matrixCanvas = document.getElementById('matrix-canvas');
  if (matrixCanvas) {
    // Replace 2D canvas with high-performance CSS container
    const container = document.createElement('div');
    container.id = 'matrix-rain-container';
    matrixCanvas.parentNode.replaceChild(container, matrixCanvas);

    const tokens = [
      'v@P', 'v@N', 'v@v', 'f@radius', 'f@age', 'f@life', 'i@id', 'chf()', 'chv()', 'chi()', 'chp()', 
      'attribwrangle', 'pointwrangle', 'setpointattrib', 'addpoint', 'pcopen', 'noise', 'curlnoise', 
      'fit', 'clamp', 'normalize', 'cross', 'dot', 'length', 'distance', 'vector', 'matrix', 'float', 
      'int', 'string', 'struct', 'import', 'SOP', 'DOP', 'LOP', 'VOP', 'TOP', 'CHOP', 'ROP', 'COP', 
      'APEX', 'KINEFX', 'SOLVER', 'NET', 'ASSET', 'karma', 'mantra', 'materialx', 'pyside', 'hda', 
      'ｦ', 'ｧ', 'ｨ', 'ｩ', 'ｪ', 'ｫ', 'ｬ', 'ｭ', 'ｮ', 'ｯ', 'ｰ', 'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 
      'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', 'ﾀ', 'ﾁ', 'ﾂ', 'ﾃ', 'ﾄ', 'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾉ', 
      '∑', '√', '∫', '∂', 'θ', 'λ', 'π', '∞', '×', '÷', 'Δ', 'Ω', '0', '1', '0', '1'
    ];

    const colWidth = 8; // Pixel-dense horizontal columns count
    const colCount = Math.floor(window.innerWidth / colWidth) + 1;

    for (let i = 0; i < colCount; i++) {
      const col = document.createElement('div');
      col.className = 'matrix-col';
      
      const speed = 1.0 + Math.random() * 2.0; // Flow speed in seconds (faster fall)
      const delay = Math.random() * -12; // Negative delay to start cascades instantly
      const fontSize = 10 + Math.floor(Math.random() * 6);
      
      col.style.left = `${(i / colCount) * 100}%`;
      col.style.fontSize = `${fontSize}px`;
      col.style.animationDuration = `${speed}s`;
      col.style.animationDelay = `${delay}s`;
      
      // Create cascade of 5 trailing characters
      const length = 5 + Math.floor(Math.random() * 3);
      for (let j = 0; j < length; j++) {
        const span = document.createElement('span');
        span.textContent = tokens[Math.floor(Math.random() * tokens.length)];
        if (j === length - 1) {
          span.className = 'matrix-head';
        } else {
          span.style.opacity = (j / length) * 0.75;
        }
        col.appendChild(span);
      }
      container.appendChild(col);
    }

    // Dynamic token values swapper to keep it active
    setInterval(() => {
      const spans = container.querySelectorAll('span');
      if (spans.length > 0) {
        const count = Math.min(20, Math.floor(spans.length * 0.04));
        for (let i = 0; i < count; i++) {
          const randSpan = spans[Math.floor(Math.random() * spans.length)];
          randSpan.textContent = tokens[Math.floor(Math.random() * tokens.length)];
        }
      }
    }, 200);
  }

  // --- 1. Boot Loader Animation ---
  const runBootloader = () => {
    let progress = 0;
    const logs = [
      "System: Initializing viewports... OK",
      "Scanning SOP/DOP/LOP operator definitions... OK",
      "Compiling procedural geometry kernels... OK",
      "Binding VEX JIT compiler hooks... OK",
      "Initializing dynamics particle engine... OK",
      "Loading USD lookdev scene description... OK",
      "Boot solver: READY."
    ];

    let logIndex = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        if (loaderBar) loaderBar.style.width = '100%';
        if (loaderStatus) loaderStatus.textContent = "Viewport Booted (READY)";

        // Append final log
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = `> Workstation initialized successfully.`;
        logContainer?.appendChild(line);

        // Fade out splash loader
        setTimeout(() => {
          if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
          }
        }, 600);
      } else {
        if (loaderBar) loaderBar.style.width = `${Math.floor(progress)}%`;
        if (loaderStatus) loaderStatus.textContent = `Cooking Nodes (${Math.floor(progress)}%)`;
        
        if (progress > (logIndex + 1) * 13 && logIndex < logs.length) {
          const line = document.createElement('div');
          line.className = 'log-line';
          line.textContent = `> ${logs[logIndex]}`;
          logContainer?.appendChild(line);
          if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
          logIndex++;
        }
      }
    }, 90);
  };

  runBootloader();

  // --- 2. Live FPS & Playbar Simulation ---
  let lastFpsTime = performance.now();
  let frame = 1;

  // Frame Loop (mimicking Houdini's standard playbar at 24fps)
  setInterval(() => {
    frame = (frame % 240) + 1;
    const frameCounter = document.getElementById('hud-frame-counter');
    if (frameCounter) {
      frameCounter.textContent = `${frame} / 240`;
    }
  }, 1000 / 24);

  // FPS Monitor
  const tickFps = () => {
    requestAnimationFrame(tickFps);
    const now = performance.now();
    const fps = Math.min(60, Math.round(1000 / (now - lastFpsTime)));
    lastFpsTime = now;

    const fpsCounter = document.getElementById('hud-fps-counter');
    if (fpsCounter) {
      fpsCounter.textContent = `${fps.toFixed(1)} fps`;
      if (fps < 40) {
        fpsCounter.style.color = '#ff3b30'; // Warning red for lags
      } else {
        fpsCounter.style.color = '#00ffaa'; // Optimal green
      }
    }
  };
  requestAnimationFrame(tickFps);

  // --- 3. Scroll-Spy Section Camera Focus ---
  const setMode = (mode) => {
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

      // Update global CSS variable for Matrix Rain color
      document.documentElement.style.setProperty('--matrix-color', hexColor);
    }
  };

  const updateActiveSection = () => {
    let current = 'hero';
    let currentMode = 'HERO';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 260;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
        currentMode = section.getAttribute('data-mode') || 'HERO';
      }
    });

    if (activeSection !== current) {
      activeSection = current;
      activeMode = currentMode;
      setMode(currentMode);
    }
  };

  window.addEventListener('scroll', updateActiveSection);
  // Initial run to sync colors
  updateActiveSection();

  // --- 4. Custom Houdini Pane Flags System ---
  document.querySelectorAll('.houdini-pane').forEach((pane) => {
    const bypassFlag = pane.querySelector('.flag-bypass');
    const displayFlag = pane.querySelector('.flag-display');

    if (bypassFlag) {
      bypassFlag.addEventListener('click', () => {
        const isBypassed = bypassFlag.classList.toggle('active');
        pane.classList.toggle('bypassed', isBypassed);
      });
    }

    if (displayFlag) {
      displayFlag.addEventListener('click', () => {
        displayFlag.classList.toggle('active');
      });
    }
  });

  // --- 4.5. Renderer Cycling HUD Event ---
  const rendererSelector = document.getElementById('hud-renderer-selector');
  if (rendererSelector) {
    const renderers = ['Karma XPU', 'RenderMan', 'Arnold', 'Redshift', 'Mantra'];
    let rendererIndex = 0;
    
    rendererSelector.addEventListener('click', () => {
      rendererIndex = (rendererIndex + 1) % renderers.length;
      const span = rendererSelector.querySelector('span');
      if (span) {
        span.textContent = renderers[rendererIndex];
        
        // Show compiler status HUD feedback
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = '#ff6a00';
        notification.style.color = '#000';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.fontFamily = 'monospace';
        notification.style.fontSize = '11px';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '99999';
        notification.style.boxShadow = '0 4px 15px rgba(255, 106, 0, 0.4)';
        notification.style.border = '1px solid #ff8533';
        notification.textContent = `> Switched viewport renderer target: ${renderers[rendererIndex]}`;

        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.5s ease';
          setTimeout(() => notification.remove(), 500);
        }, 2000);
      }
    });
  }

  // --- 5. Vertical Viewport Shelf Toolbar Actions ---
  const gridBtn = document.getElementById('btn-toggle-grid');
  const translateBtn = document.getElementById('btn-translate');
  const rotateBtn = document.getElementById('btn-rotate');
  const scaleBtn = document.getElementById('btn-scale');

  const toolButtons = [translateBtn, rotateBtn, scaleBtn];

  const setViewportTool = (mode) => {
    // Toggle active classes on toolbar buttons
    toolButtons.forEach(btn => btn?.classList.remove('active'));
    
    // Set active cursor on body
    document.body.classList.remove('mode-select', 'mode-translate', 'mode-rotate', 'mode-scale');
    
    if (mode === 'select') {
      document.body.classList.add('mode-select');
    } else if (mode === 'translate') {
      translateBtn?.classList.add('active');
      document.body.classList.add('mode-translate');
    } else if (mode === 'rotate') {
      rotateBtn?.classList.add('active');
      document.body.classList.add('mode-rotate');
    } else if (mode === 'scale') {
      scaleBtn?.classList.add('active');
      document.body.classList.add('mode-scale');
    }

    // Get current mode colors for notification styling
    const rgbStr = themeColors[activeMode] || themeColors.HERO;

    // Output status notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.background = rgbStr;
    notification.style.color = '#000';
    notification.style.padding = '10px 18px';
    notification.style.borderRadius = '4px';
    notification.style.fontFamily = 'monospace';
    notification.style.fontSize = '11px';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '99999';
    notification.style.border = '1px solid rgba(255,255,255,0.2)';
    notification.style.boxShadow = `0 4px 15px ${rgbStr.replace('rgb', 'rgba').replace(')', ', 0.3)')}`;
    notification.textContent = `> Viewport tool: ${mode.toUpperCase()} mode enabled.`;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 1500);
  };

  if (gridBtn) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.toggle('active');
    });
  }

  translateBtn?.addEventListener('click', () => setViewportTool('translate'));
  rotateBtn?.addEventListener('click', () => setViewportTool('rotate'));
  scaleBtn?.addEventListener('click', () => setViewportTool('scale'));

  // Initialize with Translate mode on boot
  setViewportTool('translate');

  // --- 5.5. Viewport Keyboard Shortcuts (G, S, T, R, E) ---
  window.addEventListener('keydown', (e) => {
    // If typing in forms/inputs, ignore shortcuts
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    if (key === 'g') {
      if (gridBtn) {
        gridBtn.classList.toggle('active');
      }
    } else if (key === 's') {
      setViewportTool('select');
    } else if (key === 't') {
      setViewportTool('translate');
    } else if (key === 'r') {
      setViewportTool('rotate');
    } else if (key === 'e') {
      setViewportTool('scale');
    }
  });

  // --- 6. HDA Solver Visitor WhatsApp Redirect Form ---
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('visitor-name').value.trim();
      const phone = document.getElementById('visitor-phone').value.trim();
      const email = document.getElementById('visitor-email').value.trim();
      const company = document.getElementById('visitor-company').value.trim() || '(Optional)';

      // Formulate message
      const textMessage = `Hello A.v.s.s.r. Vamsi Lakshman , I visited your Houdini TD Portfolio!\n\n*My Info:*\n* *Name:* ${name}\n* *Phone:* ${phone}\n* *Email:* ${email}\n* *Company/ Organization:* ${company}\n\nYou Can Msg Me Here\nI Do Reply Here`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=919494191198&text=${encodeURIComponent(textMessage)}`;

      // Open redirect solver
      window.open(whatsappUrl, '_blank');

      // Create desktop compile HUD pop-up
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.background = '#ff6a00';
      notification.style.color = '#000';
      notification.style.padding = '12px 20px';
      notification.style.borderRadius = '4px';
      notification.style.fontFamily = 'monospace';
      notification.style.fontSize = '11px';
      notification.style.fontWeight = 'bold';
      notification.style.zIndex = '99999';
      notification.style.boxShadow = '0 4px 15px rgba(255, 106, 0, 0.4)';
      notification.style.border = '1px solid #ff8533';
      notification.textContent = '> HDA Node cooked successfully. Solver redirecting...';

      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }, 3500);

      contactForm.reset();
    });
  }
});
