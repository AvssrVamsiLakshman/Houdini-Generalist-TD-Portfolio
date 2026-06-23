import './style.css';
import { WebGLController } from './webgl.js';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize WebGL & Matrix Canvas Controller
  const webgl = new WebGLController('webgl-canvas');

  // Cache UI elements
  const loader = document.getElementById('loader');
  const loaderBar = loader?.querySelector('.loader-bar');
  const loaderStatus = loader?.querySelector('.loader-status');
  const logContainer = loader?.querySelector('.loader-log');
  
  const sections = document.querySelectorAll('section[id]');
  const contactForm = document.getElementById('visitor-contact-form');

  let activeSection = 'hero';

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
          // Recalculate precise layout bounds after loading screen fades
          webgl.updateAvoidBounds();
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
      if (webgl) {
        webgl.setMode(currentMode);
      }
    }
  };

  window.addEventListener('scroll', updateActiveSection);

  // --- 4. Custom Houdini Pane Flags System ---
  document.querySelectorAll('.houdini-pane').forEach((pane) => {
    // Houdini Node Action Flags (Render, Bypass, etc.)
    const bypassFlag = pane.querySelector('.flag-bypass');
    const displayFlag = pane.querySelector('.flag-display');
    const sectionMode = pane.closest('section')?.getAttribute('data-mode') || 'SOP';

    if (bypassFlag) {
      bypassFlag.addEventListener('click', () => {
        const isBypassed = bypassFlag.classList.toggle('active');
        pane.classList.toggle('bypassed', isBypassed);
        
        // Update WebGL rendering visibility state
        if (webgl.bypassFlags[sectionMode] !== undefined) {
          webgl.bypassFlags[sectionMode] = isBypassed;
        }
      });
    }

    if (displayFlag) {
      displayFlag.addEventListener('click', () => {
        const isDisplayOn = displayFlag.classList.toggle('active');
        // Toggle visibility state (reverse of bypass)
        if (webgl.bypassFlags[sectionMode] !== undefined) {
          webgl.bypassFlags[sectionMode] = !isDisplayOn;
        }
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
    webgl.transformMode = mode;

    // Toggle active classes on toolbar buttons
    toolButtons.forEach(btn => btn?.classList.remove('active'));
    
    // Set active cursor on canvas wrapper
    const canvas = webgl.webglCanvas;
    canvas.className = ''; // Reset
    
    if (mode === 'select') {
      canvas.classList.add('mode-select');
    } else if (mode === 'translate') {
      translateBtn?.classList.add('active');
      canvas.classList.add('mode-translate');
    } else if (mode === 'rotate') {
      rotateBtn?.classList.add('active');
      canvas.classList.add('mode-rotate');
    } else if (mode === 'scale') {
      scaleBtn?.classList.add('active');
      canvas.classList.add('mode-scale');
    }

    // Get current mode colors for notification styling
    const colTarget = webgl.themeColors[webgl.activeMode] || webgl.themeColors.HERO;
    const rgbStr = `rgb(${colTarget.r}, ${colTarget.g}, ${colTarget.b})`;

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
    notification.style.boxShadow = `0 4px 15px rgba(${colTarget.r}, ${colTarget.g}, ${colTarget.b}, 0.3)`;
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
      const active = gridBtn.classList.toggle('active');
      webgl.displayGrid = active;
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
        const active = gridBtn.classList.toggle('active');
        webgl.displayGrid = active;
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

      // Formulate message
      const textMessage = `Hello Vamsi, I visited your Houdini TD Portfolio!\n\n*HDA Solver Config Cooked:*\n- *Name:* ${name}\n- *Phone:* ${phone}\n- *Email:* ${email}`;
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
