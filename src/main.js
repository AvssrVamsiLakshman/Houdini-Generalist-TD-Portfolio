import './style.css';
import { WebGLController } from './webgl.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize WebGL Scene
  const webgl = new WebGLController('webgl-canvas');

  // Cache UI elements
  const loader = document.getElementById('loader');
  const loaderBar = loader.querySelector('.loader-bar');
  const loaderStatus = loader.querySelector('.loader-status');
  const logContainer = loader.querySelector('.loader-log');
  
  const sections = document.querySelectorAll('section[id]');
  const contactForm = document.getElementById('visitor-contact-form');

  let activeSection = 'hero';

  // --- 1. Boot Loader Animation ---
  const runBootloader = () => {
    let progress = 0;
    const logs = [
      "Loading VEX compiler... OK",
      "Scanning /obj/geo/ SOP sub-networks... OK",
      "Initializing dynamics engine (Vellum/Pyro)... OK",
      "Compiling MaterialX nodes... OK",
      "Binding pipeline listener... OK",
      "System: READY."
    ];

    let logIndex = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        loaderBar.style.width = '100%';
        loaderStatus.textContent = "Workstation Booted";

        // Add final log line
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = `> Boot solver successful.`;
        logContainer.appendChild(line);

        // Fade out loader
        setTimeout(() => {
          loader.style.opacity = '0';
          loader.style.visibility = 'hidden';
        }, 500);
      } else {
        loaderBar.style.width = `${Math.floor(progress)}%`;
        loaderStatus.textContent = `Compiling VEX Kernels (${Math.floor(progress)}%)`;
        
        if (progress > (logIndex + 1) * 15 && logIndex < logs.length) {
          const line = document.createElement('div');
          line.className = 'log-line';
          line.textContent = `> ${logs[logIndex]}`;
          logContainer.appendChild(line);
          logContainer.scrollTop = logContainer.scrollHeight;
          logIndex++;
        }
      }
    }, 100);
  };

  runBootloader();

  // --- 2. Scroll-Spy and WebGL Mode Trigger ---
  const updateActiveSection = () => {
    let current = 'hero';
    let currentMode = 'SOP';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 250;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
        currentMode = section.getAttribute('data-mode') || 'SOP';
      }
    });

    if (activeSection !== current) {
      activeSection = current;

      // Update WebGL State based on current section mode (SOP, DOP, LOP, TOP)
      if (webgl) {
        webgl.setMode(currentMode);
      }
    }
  };

  window.addEventListener('scroll', updateActiveSection);

  // --- 3. WhatsApp Redirect Visitor Form Submission ---
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('visitor-name').value.trim();
      const phone = document.getElementById('visitor-phone').value.trim();
      const email = document.getElementById('visitor-email').value.trim();

      // Compile visitor info text message
      const textMessage = `Hello Vamsi, I visited your Houdini TD Portfolio!\n\n*Visitor Info:*\n- *Name:* ${name}\n- *Phone:* ${phone}\n- *Email:* ${email}`;
      
      // Target phone number: +919494191198
      const whatsappUrl = `https://api.whatsapp.com/send?phone=919494191198&text=${encodeURIComponent(textMessage)}`;

      // Open WhatsApp link
      window.open(whatsappUrl, '_blank');

      // Show onscreen confirmation
      const banner = document.createElement('div');
      banner.style.position = 'fixed';
      banner.style.bottom = '20px';
      banner.style.right = '20px';
      banner.style.background = '#ff6a00';
      banner.style.color = '#000';
      banner.style.padding = '12px 20px';
      banner.style.borderRadius = '4px';
      banner.style.fontFamily = 'monospace';
      banner.style.fontSize = '12px';
      banner.style.fontWeight = 'bold';
      banner.style.zIndex = '99999';
      banner.style.boxShadow = '0 4px 15px rgba(255, 106, 0, 0.4)';
      banner.style.border = '1px solid #ff8533';
      banner.textContent = '> Visitor details compiled. WhatsApp solver triggered.';

      document.body.appendChild(banner);
      setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.5s ease';
        setTimeout(() => banner.remove(), 500);
      }, 4000);

      contactForm.reset();
    });
  }
});
