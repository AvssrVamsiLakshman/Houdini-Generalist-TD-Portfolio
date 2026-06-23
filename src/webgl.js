import * as THREE from 'three';
import { gsap } from 'gsap';

export class WebGLController {
  constructor(webglCanvasId) {
    this.webglCanvas = document.getElementById(webglCanvasId);
    this.matrixCanvas = document.getElementById('matrix-canvas');
    if (!this.webglCanvas || !this.matrixCanvas) return;

    // Simulation & interaction parameters
    this.vexParams = { frequency: 7.5, amplitude: 0.9, speed: 2.0 };
    this.sopParams = { extrude: 1.6, radius: 3.0 };
    this.dopParams = { turbulence: 2.25, wind: 1.8 };
    this.bypassFlags = { SOP: false, DOP: false, COP: false, VOP: false, LOP: false, APEX: false, CHOP: false, TOOLDEV: false, CROWD: false, CFX: false };
    
    this.displayGrid = true;
    this.displayRain = true;
    this.activeMode = 'HERO';

    // Color theme values (RGB values for smooth GSAP transitions)
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
      CFX: { r: 255, g: 118, b: 117 }     // Salmon/Coral (CFX)
    };

    // Current transition color tween tracker
    this.currentColor = { r: 255, g: 133, b: 0 };

    // Mouse coordinates tracker
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Camera target positions in 3D Space
    this.cameraStates = {
      HERO: { px: 0, py: 25, pz: 42, tx: 0, ty: 0, tz: 0 },
      SOP: { px: 0, py: 5, pz: 11, tx: 0, ty: 0, tz: 0 },
      DOP: { px: 22, py: 6, pz: -10, tx: 25, ty: 5, tz: -20 },
      LOP: { px: -22, py: 14, pz: 32, tx: -20, ty: 10, tz: 20 },
      TOP: { px: 22, py: -2, pz: -15, tx: 20, ty: -10, tz: -30 },
      CHOP: { px: -23, py: -6, pz: -10, tx: -20, ty: -10, tz: -20 },
      CROWD: { px: 0, py: 10, pz: -3, tx: 0, ty: -7, tz: -15 },
      CFX: { px: -22, py: 8, pz: 10, tx: -25, ty: 2, tz: 0 }
    };

    // Current camera lookAt coordinates
    this.cameraLookAt = new THREE.Vector3(0, 0, 0);

    // Viewport transform gizmos properties
    this.transformMode = 'select';
    this.activeTransformObject = null;
    this.isDragging = false;
    this.dragStartMouse = { x: 0, y: 0 };
    this.origPos = new THREE.Vector3();
    this.origRot = new THREE.Euler();
    this.origScale = new THREE.Vector3();

    // Initialize caching for section coordinates
    this.currentScrollY = window.scrollY;
    this.sectionBounds = [];
    this.avoidBounds = [];

    // Initialize systems
    this.initThree();
    this.buildTransformGizmos();
    this.initMatrix();
    this.resize();

    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Recalculate section bounds on scroll to ensure exact coordinates during layout shift/scroll
    window.addEventListener('scroll', () => {
      this.currentScrollY = window.scrollY;
      this.updateSectionBounds();
    });

    window.addEventListener('load', () => {
      this.updateSectionBounds();
      this.updateAvoidBounds();
    });

    // Pointer events for transform drag-and-drop physics
    this.webglCanvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));

    this.animate();
  }

  initThree() {
    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.webglCanvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 25, 42);

    // 3. Grid Helper (Houdini ground viewport grid)
    this.gridHelper = new THREE.GridHelper(80, 80, 0x333333, 0x1f1f1f);
    this.gridHelper.position.y = -8;
    this.scene.add(this.gridHelper);

    // 4. Studio Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.keyLight.position.set(10, 20, 15);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x00a2ff, 0.3);
    this.fillLight.position.set(-15, 5, -10);
    this.scene.add(this.fillLight);

    // 5. Build 3D Objects/Modules
    this.buildSopGeometry();
    this.buildDopDynamics();
    this.buildLopStage();
    this.buildTopNodeGraph();
    this.buildChopChannels();
    this.buildCrowdAgents();
    this.buildCfxCloth();
  }

  buildSopGeometry() {
    this.sopGroup = new THREE.Group();
    this.sopGroup.position.set(0, 0, 0);

    // Procedural Torus Knot Geometry
    const sopGeom = new THREE.TorusKnotGeometry(this.sopParams.radius, this.sopParams.extrude, 100, 16);
    this.sopInitialPositions = sopGeom.attributes.position.clone();

    this.sopMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    this.sopMesh = new THREE.Mesh(sopGeom, this.sopMaterial);
    this.sopGroup.add(this.sopMesh);
    this.scene.add(this.sopGroup);
  }

  buildDopDynamics() {
    this.dopGroup = new THREE.Group();
    this.dopGroup.position.set(25, 5, -20);

    // Dynamic Swirling Particle Solver
    const particleCount = 1200;
    this.dopParticleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.dopVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = Math.random() * 8 + 1;
      const y = (Math.random() - 0.5) * 12;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;

      this.dopVelocities.push({
        theta: theta,
        radius: radius,
        y: y,
        speed: Math.random() * 0.02 + 0.005
      });
    }

    this.dopParticleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.dopMaterial = new THREE.PointsMaterial({
      color: 0x00a2ff,
      size: 0.12,
      transparent: true,
      opacity: 0.8
    });

    this.dopParticles = new THREE.Points(this.dopParticleGeom, this.dopMaterial);
    this.dopGroup.add(this.dopParticles);
    this.scene.add(this.dopGroup);
  }

  buildLopStage() {
    this.lopGroup = new THREE.Group();
    this.lopGroup.position.set(-20, 10, 20);

    // Lookdev Sphere
    const sphereGeom = new THREE.SphereGeometry(3, 32, 32);
    this.lopMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false
    });
    this.lopSphere = new THREE.Mesh(sphereGeom, this.lopMaterial);
    this.lopGroup.add(this.lopSphere);

    // Bounding Box Stage Guides
    const stageBoundsGeom = new THREE.BoxGeometry(9, 9, 9);
    const boundsEdge = new THREE.EdgesGeometry(stageBoundsGeom);
    this.lopBoundsLine = new THREE.LineSegments(
      boundsEdge,
      new THREE.LineBasicMaterial({ color: 0xe056fd, transparent: true, opacity: 0.35 })
    );
    this.lopGroup.add(this.lopBoundsLine);

    // Camera rig overlay
    const camHelper = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ConeGeometry(2, 3, 4)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    camHelper.position.set(0, 0, 7);
    camHelper.rotation.x = Math.PI / 2;
    this.lopGroup.add(camHelper);

    // Rotating local stage light
    this.lopLocalLight = new THREE.PointLight(0xe056fd, 1.5, 12);
    this.lopLocalLight.position.set(0, 4, 3);
    this.lopGroup.add(this.lopLocalLight);

    this.scene.add(this.lopGroup);
  }

  buildTopNodeGraph() {
    this.topGroup = new THREE.Group();
    this.topGroup.position.set(20, -10, -30);

    // Flowchart Node Boxes
    const nodeGeom = new THREE.BoxGeometry(4, 2, 0.6);
    this.topNodeMaterial = new THREE.MeshBasicMaterial({
      color: 0x27c93f,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });

    this.nodes = [];
    const nodePositions = [
      new THREE.Vector3(-8, 5, 0),
      new THREE.Vector3(8, 5, 0),
      new THREE.Vector3(-4, -4, 0),
      new THREE.Vector3(4, -4, 0)
    ];

    nodePositions.forEach((pos) => {
      const nodeMesh = new THREE.Mesh(nodeGeom, this.topNodeMaterial);
      nodeMesh.position.copy(pos);
      this.topGroup.add(nodeMesh);
      this.nodes.push(nodeMesh);
    });

    // Curved Node connections (Wires)
    this.wires = [];
    this.wireCurves = [
      new THREE.QuadraticBezierCurve3(nodePositions[0], new THREE.Vector3(0, 4, 2), nodePositions[2]),
      new THREE.QuadraticBezierCurve3(nodePositions[1], new THREE.Vector3(0, 4, -2), nodePositions[3]),
      new THREE.QuadraticBezierCurve3(nodePositions[2], new THREE.Vector3(0, -6, 0), nodePositions[3])
    ];

    this.wireCurves.forEach((curve) => {
      const points = curve.getPoints(30);
      const wireGeom = new THREE.BufferGeometry().setFromPoints(points);
      const wireMesh = new THREE.Line(wireGeom, new THREE.LineBasicMaterial({ color: 0x1f7f2b, transparent: true, opacity: 0.45 }));
      this.topGroup.add(wireMesh);
      this.wires.push(wireMesh);
    });

    // Processing data packet spheres
    const packetGeom = new THREE.SphereGeometry(0.2, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x27c93f });
    
    this.packets = [];
    for (let i = 0; i < 3; i++) {
      const pMesh = new THREE.Mesh(packetGeom, packetMat);
      this.topGroup.add(pMesh);
      this.packets.push({ mesh: pMesh, curve: this.wireCurves[i], offset: Math.random() });
    }

    this.scene.add(this.topGroup);
  }

  buildChopChannels() {
    this.chopGroup = new THREE.Group();
    this.chopGroup.position.set(-20, -10, -20);

    const channelLength = 80;
    this.chopGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(channelLength * 3);

    for (let i = 0; i < channelLength; i++) {
      positions[i * 3] = (i - channelLength / 2) * 0.25;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    this.chopGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.chopMaterial = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.75
    });

    this.chopLine1 = new THREE.Line(this.chopGeom, this.chopMaterial);
    this.chopLine2 = this.chopLine1.clone();
    this.chopLine2.position.y = -2;

    this.chopGroup.add(this.chopLine1);
    this.chopGroup.add(this.chopLine2);
    this.scene.add(this.chopGroup);
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

    // Fallback for footer area
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
    // Avoid drawing rain over the hero card, video containers, or the footer
    const avoidElements = document.querySelectorAll('.hero-card, .video-card, .app-footer');
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

    // Resize Three.js webgl canvas
    this.webglCanvas.width = this.width;
    this.webglCanvas.height = this.height;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);

    // Resize Matrix 2D canvas
    this.matrixCanvas.width = this.width;
    this.matrixCanvas.height = this.height;

    // Reset Matrix digital rain columns
    const columnWidth = 22;
    const columnsCount = Math.floor(this.width / columnWidth) + 1;
    this.matrixColumns = [];

    for (let i = 0; i < columnsCount; i++) {
      this.matrixColumns.push({
        x: i * columnWidth,
        y: Math.random() * -this.height * 1.5,
        speed: Math.random() * 2.5 + 1.2,
        opacity: Math.random() * 0.4 + 0.6,
        fontSize: Math.floor(Math.random() * 6) + 10,
        tokenIndex: Math.floor(Math.random() * this.tokens.length)
      });
    }

    this.updateSectionBounds();
    this.updateAvoidBounds();
  }

  onMouseMove(e) {
    // Normalised mouse coordinates [-1, 1]
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    
    this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  setMode(mode) {
    this.activeMode = mode;

    // Map section mode groups
    let targetCameraKey = 'HERO';
    if (mode === 'SOP' || mode === 'APEX') {
      targetCameraKey = 'SOP';
      this.activeTransformObject = this.sopGroup;
    } else if (mode === 'DOP') {
      targetCameraKey = 'DOP';
      this.activeTransformObject = this.dopGroup;
    } else if (mode === 'COP' || mode === 'VOP' || mode === 'LOP') {
      targetCameraKey = 'LOP';
      this.activeTransformObject = this.lopGroup;
    } else if (mode === 'CHOP') {
      targetCameraKey = 'CHOP';
      this.activeTransformObject = this.chopGroup;
    } else if (mode === 'TOOLDEV') {
      targetCameraKey = 'TOP';
      this.activeTransformObject = this.topGroup;
    } else if (mode === 'CROWD') {
      targetCameraKey = 'CROWD';
      this.activeTransformObject = this.crowdGroup;
    } else if (mode === 'CFX') {
      targetCameraKey = 'CFX';
      this.activeTransformObject = this.cfxGroup;
    } else {
      this.activeTransformObject = null;
    }

    // 1. GSAP Cam Position Tween
    const camTarget = this.cameraStates[targetCameraKey] || this.cameraStates.HERO;
    
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.cameraLookAt);

    gsap.to(this.camera.position, {
      x: camTarget.px,
      y: camTarget.py,
      z: camTarget.pz,
      duration: 2.2,
      ease: 'power3.out'
    });

    gsap.to(this.cameraLookAt, {
      x: camTarget.tx,
      y: camTarget.ty,
      z: camTarget.tz,
      duration: 2.2,
      ease: 'power3.out'
    });

    // 2. GSAP Color Theme Tween
    const colTarget = this.themeColors[mode] || this.themeColors.HERO;
    gsap.killTweensOf(this.currentColor);
    gsap.to(this.currentColor, {
      r: colTarget.r,
      g: colTarget.g,
      b: colTarget.b,
      duration: 1.5,
      ease: 'power2.out'
    });

    // 3. Update HUD elements on screen
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
                        (mode === 'CFX') ? '#ff7675' : '#ff8500';
      solverText.style.color = hexColor;
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now() * 0.001;

    // 1. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
    this.camera.lookAt(this.cameraLookAt);

    // Toggle 3D grid display state
    this.gridHelper.visible = this.displayGrid;

    // Update transform gizmo position, scale, and visibility
    if (this.gizmoGroup) {
      if (this.transformMode === 'select' || !this.activeTransformObject || !this.activeTransformObject.visible) {
        this.gizmoGroup.visible = false;
      } else {
        this.gizmoGroup.visible = true;
        this.gizmoGroup.position.copy(this.activeTransformObject.position);
        
        // Match visually with target geometry scale
        const scaleVal = this.activeTransformObject.scale.x;
        this.gizmoGroup.scale.set(scaleVal, scaleVal, scaleVal);
        
        // Toggle sub-gizmo categories
        this.translateGizmo.visible = (this.transformMode === 'translate');
        this.rotateGizmo.visible = (this.transformMode === 'rotate');
        this.scaleGizmo.visible = (this.transformMode === 'scale');
      }
    }

    // Smoothly colorize 3D lines based on current theme color
    const hexColor = (Math.round(this.currentColor.r) << 16) + (Math.round(this.currentColor.g) << 8) + Math.round(this.currentColor.b);
    
    // Dynamic procedural animations
    this.animateSopMesh(time, hexColor);
    this.animateDopParticles(time, hexColor);
    this.animateLopStage(time, hexColor);
    this.animateTopGraph(time, hexColor);
    this.animateChopLines(time, hexColor);
    this.animateCrowd(time, hexColor);
    this.animateCfx(time, hexColor);

    // 2. Render 2D Matrix Rain Layer
    this.renderMatrixRain();
  }

  animateSopMesh(time, hexColor) {
    if (this.bypassFlags.SOP || this.bypassFlags.APEX) {
      this.sopGroup.visible = false;
      return;
    }
    this.sopGroup.visible = true;

    // Dynamically rebuild geometry if radius/extrude sliders are tweaked
    const currentGeom = this.sopMesh.geometry;
    const currentParams = currentGeom.parameters;
    if (currentParams && (currentParams.radius !== this.sopParams.radius || currentParams.tube !== this.sopParams.extrude)) {
      currentGeom.dispose();
      const newGeom = new THREE.TorusKnotGeometry(this.sopParams.radius, this.sopParams.extrude, 100, 16);
      this.sopInitialPositions = newGeom.attributes.position.clone();
      this.sopMesh.geometry = newGeom;
    }

    this.sopMaterial.color.setHex(hexColor);
    this.sopMesh.rotation.y = time * 0.08;
    this.sopMesh.rotation.x = time * 0.03;

    // VEX parameter height deforming calculation
    const positionAttr = this.sopMesh.geometry.attributes.position;
    const initial = this.sopInitialPositions;
    
    const freq = this.vexParams.frequency;
    const amp = this.vexParams.amplitude;
    const sp = this.vexParams.speed;

    for (let i = 0; i < positionAttr.count; i++) {
      const x = initial.getX(i);
      const y = initial.getY(i);
      const z = initial.getZ(i);
      const dist = Math.sqrt(x*x + y*y + z*z);
      
      const wave = Math.sin(dist * freq - time * sp) * amp;
      const factor = 1 + wave * 0.15;
      
      positionAttr.setXYZ(i, x * factor, y * factor, z * factor);
    }
    positionAttr.needsUpdate = true;
  }

  animateDopParticles(time, hexColor) {
    if (this.bypassFlags.DOP) {
      this.dopGroup.visible = false;
      return;
    }
    this.dopGroup.visible = true;

    this.dopMaterial.color.setHex(hexColor);
    this.dopParticles.rotation.y = time * 0.02;

    const posAttr = this.dopParticles.geometry.attributes.position;
    const count = posAttr.count;
    const turbulence = this.dopParams.turbulence;
    const wind = this.dopParams.wind;

    for (let i = 0; i < count; i++) {
      const vel = this.dopVelocities[i];
      vel.theta += vel.speed * wind;

      let x = Math.cos(vel.theta) * vel.radius;
      let z = Math.sin(vel.theta) * vel.radius;
      let y = vel.y + Math.sin(time * 2 + vel.radius * turbulence) * 0.8;

      // Mouse displacement pull
      if (this.targetMouseX) {
        const dx = (this.dopGroup.position.x + x) - (this.camera.position.x + this.targetMouseX * 10);
        const dy = (this.dopGroup.position.y + y) - (this.camera.position.y + this.targetMouseY * 10);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 8) {
          x += (dx / dist) * 0.5;
          y += (dy / dist) * 0.5;
        }
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  animateLopStage(time, hexColor) {
    if (this.bypassFlags.LOP || this.bypassFlags.VOP || this.bypassFlags.COP) {
      this.lopGroup.visible = false;
      return;
    }
    this.lopGroup.visible = true;

    this.lopBoundsLine.material.color.setHex(hexColor);
    
    // Rotate studio point lights around sphere
    this.lopLocalLight.position.x = Math.cos(time * 0.8) * 5;
    this.lopLocalLight.position.z = Math.sin(time * 0.8) * 5;
    this.lopLocalLight.color.setHex(hexColor);
    
    this.lopSphere.rotation.y = time * 0.2;
  }

  animateTopGraph(time, hexColor) {
    if (this.bypassFlags.TOOLDEV) {
      this.topGroup.visible = false;
      return;
    }
    this.topGroup.visible = true;

    this.topNodeMaterial.color.setHex(hexColor);

    // Rotate node frames slightly to feel 3D
    this.nodes.forEach((n, idx) => {
      n.rotation.y = Math.sin(time + idx) * 0.1;
      n.rotation.x = Math.cos(time * 0.5 + idx) * 0.05;
    });

    // Wires pulse
    this.wires.forEach((w) => {
      w.material.color.setHex(hexColor);
    });

    // Move packet nodes along Bezier curves
    this.packets.forEach((p) => {
      p.offset += 0.003;
      if (p.offset > 1.0) p.offset = 0;
      
      const pos = p.curve.getPointAt(p.offset);
      p.mesh.position.copy(pos);
      p.mesh.material.color.setHex(hexColor);
    });
  }

  animateChopLines(time, hexColor) {
    if (this.bypassFlags.CHOP) {
      this.chopGroup.visible = false;
      return;
    }
    this.chopGroup.visible = true;

    this.chopMaterial.color.setHex(hexColor);

    const updateLine = (line, offset) => {
      const posAttr = line.geometry.attributes.position;
      const length = posAttr.count;
      for (let i = 0; i < length; i++) {
        const x = posAttr.getX(i);
        const y = Math.sin(x * 0.6 + time * 4 + offset) * 0.8 * Math.cos(x * 0.1);
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    };

    updateLine(this.chopLine1, 0);
    updateLine(this.chopLine2, Math.PI / 2);
  }

  buildCrowdAgents() {
    this.crowdGroup = new THREE.Group();
    this.crowdGroup.position.set(0, -7, -15);

    // Create a 5x5 grid of walking crowd agent boxes/spheres
    const agentGeom = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    this.crowdMaterial = new THREE.MeshBasicMaterial({
      color: 0xa55eea,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    this.agents = [];
    for (let x = -4; x <= 4; x += 2) {
      for (let z = -4; z <= 4; z += 2) {
        const mesh = new THREE.Mesh(agentGeom, this.crowdMaterial);
        mesh.position.set(x + (Math.random() - 0.5) * 0.5, 0.6, z + (Math.random() - 0.5) * 0.5);
        this.crowdGroup.add(mesh);
        this.agents.push({
          mesh,
          speed: Math.random() * 0.05 + 0.02,
          offsetX: Math.random() * Math.PI,
          offsetZ: Math.random() * Math.PI
        });
      }
    }
    this.scene.add(this.crowdGroup);
  }

  buildCfxCloth() {
    this.cfxGroup = new THREE.Group();
    this.cfxGroup.position.set(-25, 0, 0);

    // Wavy cloth grid mesh representing vellum physics
    const clothGeom = new THREE.PlaneGeometry(6, 6, 12, 12);
    this.cfxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7675,
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });

    this.cfxMesh = new THREE.Mesh(clothGeom, this.cfxMaterial);
    this.cfxMesh.rotation.x = -Math.PI / 2; // Lie flat initially
    this.cfxGroup.add(this.cfxMesh);

    // Hair/strands overlay to make CFX look complete
    this.hairLines = [];
    const strandGeom = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i < 10; i++) {
      points.push(new THREE.Vector3(0, i * 0.5, 0));
    }
    strandGeom.setFromPoints(points);
    this.hairMaterial = new THREE.LineBasicMaterial({
      color: 0xff7675,
      transparent: true,
      opacity: 0.4
    });

    for (let j = 0; j < 8; j++) {
      const line = new THREE.Line(strandGeom.clone(), this.hairMaterial);
      line.position.set((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5);
      this.cfxGroup.add(line);
      this.hairLines.push(line);
    }

    this.scene.add(this.cfxGroup);
  }

  animateCrowd(time, hexColor) {
    if (this.bypassFlags.CROWD) {
      this.crowdGroup.visible = false;
      return;
    }
    this.crowdGroup.visible = true;
    this.crowdMaterial.color.setHex(hexColor);

    // Move agents up and down or forward slightly
    this.agents.forEach(agent => {
      // Bob up and down and walk side-to-side
      agent.mesh.position.y = 0.6 + Math.sin(time * 5 + agent.offsetX) * 0.15;
      agent.mesh.rotation.y = Math.sin(time * 2 + agent.offsetZ) * 0.2;
    });
  }

  animateCfx(time, hexColor) {
    if (this.bypassFlags.CFX) {
      this.cfxGroup.visible = false;
      return;
    }
    this.cfxGroup.visible = true;
    this.cfxMaterial.color.setHex(hexColor);
    this.hairMaterial.color.setHex(hexColor);

    // Deform the cloth plane dynamically using a wave function
    const posAttr = this.cfxMesh.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      // z is height in local space because plane is rotated
      const z = Math.sin(x * 0.8 + time * 3.0) * Math.cos(y * 0.8 + time * 2.0) * 0.6;
      posAttr.setZ(i, z);
    }
    posAttr.needsUpdate = true;

    // Flowing hair strands animation
    this.hairLines.forEach((line, idx) => {
      const posAttr = line.geometry.attributes.position;
      for (let i = 1; i < posAttr.count; i++) {
        // Bend based on height and time
        const y = posAttr.getY(i);
        const wave = Math.sin(y * 1.5 + time * 4.0 + idx) * 0.15 * y;
        posAttr.setX(i, wave);
      }
      posAttr.needsUpdate = true;
    });
  }

  renderMatrixRain() {
    this.matrixCtx.fillStyle = 'rgba(22, 23, 26, 0.08)';
    this.matrixCtx.fillRect(0, 0, this.width, this.height);

    if (!this.displayRain) return;

    this.matrixCtx.textAlign = 'left';

    this.matrixColumns.forEach((col) => {
      // Pick current matrix character token
      const char = this.tokens[col.tokenIndex];

      // Find matching section color for the drop's Y coordinate dynamically
      const absoluteY = col.y + this.currentScrollY;
      let matchedColor = this.themeColors.HERO; // fallback
      for (const section of this.sectionBounds) {
        if (absoluteY >= section.top && absoluteY <= section.bottom) {
          matchedColor = this.themeColors[section.mode] || this.themeColors.HERO;
          break;
        }
      }
      const r = Math.round(matchedColor.r);
      const g = Math.round(matchedColor.g);
      const b = Math.round(matchedColor.b);

      // 1. Calculate dynamic horizontal deflection for HEAD character
      let headDeflection = 0;
      const headAbsoluteY = col.y + this.currentScrollY;
      
      for (const bound of this.avoidBounds) {
        let deflection = 0;
        const centerX = (bound.left + bound.right) / 2;
        const margin = 20; // safe padding margin outside boundaries
        let yWeight = 0;
        const yBuffer = 150; // smooth entry/exit region in pixels

        if (headAbsoluteY >= bound.top - yBuffer && headAbsoluteY < bound.top) {
          yWeight = (headAbsoluteY - (bound.top - yBuffer)) / yBuffer;
          yWeight = Math.sin(yWeight * Math.PI / 2); // Ease-in
        } else if (headAbsoluteY >= bound.top && headAbsoluteY <= bound.bottom) {
          yWeight = 1;
        } else if (headAbsoluteY > bound.bottom && headAbsoluteY <= bound.bottom + yBuffer) {
          yWeight = 1 - (headAbsoluteY - bound.bottom) / yBuffer;
          yWeight = Math.sin(yWeight * Math.PI / 2); // Ease-out
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

      // Calculate mouse displacement / distortion on deflected position
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

      // Check masking boundaries for head character using final position
      let drawHead = true;
      for (const bound of this.avoidBounds) {
        if (finalHeadX >= bound.left && finalHeadX <= bound.right &&
            headAbsoluteY >= bound.top && headAbsoluteY <= bound.bottom) {
          drawHead = false;
          break;
        }
      }

      // Draw head glowing token
      if (drawHead) {
        this.matrixCtx.fillStyle = `rgba(255, 255, 255, ${col.opacity * 0.95})`;
        this.matrixCtx.shadowBlur = 6;
        this.matrixCtx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        this.matrixCtx.fillText(char, finalHeadX, col.y);
      }

      // 2. Calculate dynamic horizontal deflection for TRAIL character
      let trailDeflection = 0;
      const trailAbsoluteY = col.y - col.fontSize + this.currentScrollY;

      for (const bound of this.avoidBounds) {
        let deflection = 0;
        const centerX = (bound.left + bound.right) / 2;
        const margin = 20;
        let yWeight = 0;
        const yBuffer = 150;

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

      // Mouse distortion for trail character
      const trailDx = trailDeflectedX - this.mouseX;
      const trailDy = (col.y - col.fontSize) - this.mouseY;
      const trailDist = Math.sqrt(trailDx * trailDx + trailDy * trailDy);
      
      let trailOffsetX = 0;
      let trailFontScale = 1;
      
      if (trailDist < 120) {
        trailOffsetX = (120 - trailDist) * 0.3 * (trailDx > 0 ? 1 : -1);
        trailFontScale = 1 + (120 - trailDist) * 0.003;
      }

      const finalTrailX = trailDeflectedX + trailOffsetX;

      // Check masking boundaries for trail character using final position
      let drawTrail = true;
      for (const bound of this.avoidBounds) {
        if (finalTrailX >= bound.left && finalTrailX <= bound.right &&
            trailAbsoluteY >= bound.top && trailAbsoluteY <= bound.bottom) {
          drawTrail = false;
          break;
        }
      }

      // Draw trails (slightly lower opacity in theme color)
      if (drawTrail) {
        this.matrixCtx.shadowBlur = 0;
        this.matrixCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${col.opacity * 0.55})`;
        this.matrixCtx.font = `${Math.floor(col.fontSize * trailFontScale)}px 'JetBrains Mono', monospace`;
        this.matrixCtx.fillText(char, finalTrailX, col.y - col.fontSize);
      }

      // Advance column position
      col.y += col.speed;

      // Randomly change characters on descent
      if (Math.random() > 0.95) {
        col.tokenIndex = Math.floor(Math.random() * this.tokens.length);
      }

      // Recycle columns once offscreen
      if (col.y > this.height + 40) {
        col.y = Math.random() * -120 - 20;
        col.speed = Math.random() * 2.5 + 1.2;
        col.opacity = Math.random() * 0.4 + 0.6;
        col.tokenIndex = Math.floor(Math.random() * this.tokens.length);
      }
    });
  }

  buildTransformGizmos() {
    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.visible = false;
    this.scene.add(this.gizmoGroup);

    // 1. Translate Gizmo (Red X, Green Y, Blue Z arrows)
    this.translateGizmo = new THREE.Group();
    
    const addArrow = (dir, colorHex) => {
      const arrowGroup = new THREE.Group();
      const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), dir.clone().multiplyScalar(4.0)]);
      const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2.5 }));
      arrowGroup.add(line);
      
      const coneGeom = new THREE.ConeGeometry(0.25, 0.7, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.copy(dir).multiplyScalar(4.0);
      
      if (dir.x > 0) cone.rotation.z = -Math.PI / 2;
      else if (dir.z > 0) cone.rotation.x = Math.PI / 2;
      arrowGroup.add(cone);
      return arrowGroup;
    };

    this.translateGizmo.add(addArrow(new THREE.Vector3(1, 0, 0), 0xff3b30)); // X (Red)
    this.translateGizmo.add(addArrow(new THREE.Vector3(0, 1, 0), 0x4cd964)); // Y (Green)
    this.translateGizmo.add(addArrow(new THREE.Vector3(0, 0, 1), 0x007aff)); // Z (Blue)
    this.gizmoGroup.add(this.translateGizmo);

    // 2. Rotate Gizmo (Three rings)
    this.rotateGizmo = new THREE.Group();
    
    const addRing = (normal, colorHex) => {
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * 4.0, Math.sin(theta) * 4.0, 0));
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(points);
      const ring = new THREE.LineLoop(ringGeom, new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 }));
      
      if (normal.x > 0) ring.rotation.y = Math.PI / 2;
      else if (normal.y > 0) ring.rotation.x = Math.PI / 2;
      return ring;
    };

    this.rotateGizmo.add(addRing(new THREE.Vector3(1, 0, 0), 0xff3b30)); // X (Red)
    this.rotateGizmo.add(addRing(new THREE.Vector3(0, 1, 0), 0x4cd964)); // Y (Green)
    this.rotateGizmo.add(addRing(new THREE.Vector3(0, 0, 1), 0x007aff)); // Z (Blue)
    this.gizmoGroup.add(this.rotateGizmo);

    // 3. Scale Gizmo (Lines ending in boxes)
    this.scaleGizmo = new THREE.Group();
    
    const addScaleHandle = (dir, colorHex) => {
      const handleGroup = new THREE.Group();
      const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), dir.clone().multiplyScalar(3.8)]);
      const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 }));
      handleGroup.add(line);
      
      const boxGeom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const boxMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const box = new THREE.Mesh(boxGeom, boxMat);
      box.position.copy(dir).multiplyScalar(3.8);
      handleGroup.add(box);
      return handleGroup;
    };

    this.scaleGizmo.add(addScaleHandle(new THREE.Vector3(1, 0, 0), 0xff3b30)); // X (Red)
    this.scaleGizmo.add(addScaleHandle(new THREE.Vector3(0, 1, 0), 0x4cd964)); // Y (Green)
    this.scaleGizmo.add(addScaleHandle(new THREE.Vector3(0, 0, 1), 0x007aff)); // Z (Blue)
    this.gizmoGroup.add(this.scaleGizmo);
  }

  onPointerDown(e) {
    if (this.transformMode === 'select' || !this.activeTransformObject) return;
    
    this.isDragging = true;
    this.dragStartMouse.x = e.clientX;
    this.dragStartMouse.y = e.clientY;
    
    this.origPos.copy(this.activeTransformObject.position);
    this.origRot.copy(this.activeTransformObject.rotation);
    this.origScale.copy(this.activeTransformObject.scale);
  }

  onPointerMove(e) {
    if (!this.isDragging || !this.activeTransformObject) return;
    
    const deltaX = e.clientX - this.dragStartMouse.x;
    const deltaY = e.clientY - this.dragStartMouse.y;
    
    if (this.transformMode === 'translate') {
      this.activeTransformObject.position.x = this.origPos.x + deltaX * 0.025;
      this.activeTransformObject.position.y = this.origPos.y - deltaY * 0.025;
    } else if (this.transformMode === 'rotate') {
      this.activeTransformObject.rotation.y = this.origRot.y + deltaX * 0.015;
      this.activeTransformObject.rotation.x = this.origRot.x + deltaY * 0.015;
    } else if (this.transformMode === 'scale') {
      const factor = 1 - deltaY * 0.005;
      const s = Math.max(0.25, Math.min(3.5, this.origScale.x * factor));
      this.activeTransformObject.scale.set(s, s, s);
    }
  }

  onPointerUp() {
    this.isDragging = false;
  }
}
