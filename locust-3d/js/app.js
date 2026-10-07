/**
 * app.js - Main Application Orchestrator for 3D Locust Phase Polymorphism
 * Handles Three.js rendering, camera controls, mode switching, UI sync, interactive calipers, and AR.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LocustBuilder } from './locust_builder.js';
import { LocustAnimator } from './animation.js';
import { LocustGuides } from './guides.js';
import { LocustARManager } from './ar.js?v=20261007';
import { LocustMeasurementTool } from './measurement_tool.js';

class LocustApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.mode = 'comparison'; // 'comparison', 'solitary', 'gregarious', 'overlay'
    this.guidesVisible = false;
    this.clock = new THREE.Clock();

    this.animator = new LocustAnimator();

    this.models = {
      solitary: null,
      gregarious: null,
      guidesSolitary: null,
      guidesGregarious: null
    };

    // Camera target interpolation state
    this.targetCameraPos = new THREE.Vector3(2.0, 4.8, 8.8);
    this.targetLookAt = new THREE.Vector3(0.6, 1.3, -0.2);
    this.isCameraTransitioning = false;

    this.initScene();
    this.initLights();
    this.initModels();
    this.measuringTool = new LocustMeasurementTool(
      this.scene,
      this.camera,
      this.renderer,
      this.controls
    );

    this.initUI();
    this.setMode('comparison');

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.032);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(2.0, 4.8, 8.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 24.0;
    this.controls.target.set(0.6, 1.3, -0.2);

    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.name = 'floor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.005;
    this.scene.add(grid);
  }

  initLights() {
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.25);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    keyLight.position.set(7, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-8, 6, 4);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfde047, 1.8);
    rimLight.position.set(0, 6, -8);
    this.scene.add(rimLight);
  }

  initModels() {
    this.models.solitary = LocustBuilder.buildLocust('solitary');
    this.models.guidesSolitary = LocustGuides.createMeasurementGuides(this.models.solitary);
    this.models.solitary.add(this.models.guidesSolitary);
    this.scene.add(this.models.solitary);

    this.models.gregarious = LocustBuilder.buildLocust('gregarious');
    this.models.guidesGregarious = LocustGuides.createMeasurementGuides(this.models.gregarious);
    this.models.gregarious.add(this.models.guidesGregarious);
    this.scene.add(this.models.gregarious);
  }

  setMode(mode) {
    this.mode = mode;
    this.measuringTool.clearAll();
    this.setOverlayAlpha(mode === 'overlay');

    if (mode === 'solitary') {
      this.models.solitary.visible = true;
      this.models.gregarious.visible = false;
      this.models.solitary.position.set(0.6, 0, 0);
      this.models.solitary.rotation.set(0, Math.PI * 0.28, 0);
      this.setCameraPreset('overall', new THREE.Vector3(2.5, 4.0, 7.5), new THREE.Vector3(0.6, 1.3, -0.2));
    } else if (mode === 'gregarious') {
      this.models.solitary.visible = false;
      this.models.gregarious.visible = true;
      this.models.gregarious.position.set(0.6, 0, 0);
      this.models.gregarious.rotation.set(0, Math.PI * 0.28, 0);
      this.setCameraPreset('overall', new THREE.Vector3(2.5, 4.0, 7.5), new THREE.Vector3(0.6, 1.3, -0.2));
    } else if (mode === 'comparison') {
      this.models.solitary.visible = true;
      this.models.gregarious.visible = true;
      this.models.solitary.position.set(-1.6, 0, 0);
      this.models.gregarious.position.set(2.8, 0, 0);
      this.models.solitary.rotation.set(0, Math.PI * 0.25, 0);
      this.models.gregarious.rotation.set(0, Math.PI * 0.25, 0);
      this.setCameraPreset('overall', new THREE.Vector3(2.0, 4.8, 8.8), new THREE.Vector3(0.6, 1.3, -0.2));
    } else if (mode === 'overlay') {
      this.models.solitary.visible = true;
      this.models.gregarious.visible = true;
      this.models.solitary.position.set(0.6, 0, 0);
      this.models.gregarious.position.set(0.6, 0, 0);
      this.models.solitary.rotation.set(0, Math.PI * 0.3, 0);
      this.models.gregarious.rotation.set(0, Math.PI * 0.3, 0);
      this.setCameraPreset('overall', new THREE.Vector3(2.5, 4.0, 7.5), new THREE.Vector3(0.6, 1.3, -0.2));
    }

    this.updateHUD();
  }

  setOverlayAlpha(isOverlay) {
    if (!this.models.solitary || !this.models.gregarious) return;

    this.models.solitary.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = isOverlay ? 0.65 : 1.0;
      }
    });

    this.models.gregarious.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = isOverlay ? 0.65 : 1.0;
      }
    });
  }

  setCameraPreset(focusPart, customCam = null, customLook = null) {
    if (customCam && customLook) {
      this.targetCameraPos.copy(customCam);
      this.targetLookAt.copy(customLook);
      this.isCameraTransitioning = true;
      return;
    }

    const isSideBySide = this.mode === 'comparison';

    switch (focusPart) {
      case 'wings':
        if (isSideBySide) {
          this.targetCameraPos.set(2.8, 3.8, -4.5);
          this.targetLookAt.set(0.6, 1.5, -2.0);
        } else {
          this.targetCameraPos.set(2.4, 3.0, -3.5);
          this.targetLookAt.set(0.6, 1.4, -1.8);
        }
        break;

      case 'hindlegs':
        // Lateral profile view highlighting the Z-folded femur and tibia
        if (isSideBySide) {
          this.targetCameraPos.set(5.6, 2.6, 0.5);
          this.targetLookAt.set(1.0, 1.3, -0.4);
        } else {
          this.targetCameraPos.set(4.2, 2.4, 0.2);
          this.targetLookAt.set(0.6, 1.3, -0.4);
        }
        break;

      case 'pronotum':
        if (isSideBySide) {
          this.targetCameraPos.set(0.6, 3.5, 4.5);
          this.targetLookAt.set(0.6, 1.7, 0.6);
        } else {
          this.targetCameraPos.set(1.8, 2.6, 3.2);
          this.targetLookAt.set(0.6, 1.6, 0.6);
        }
        break;

      case 'head':
        if (isSideBySide) {
          this.targetCameraPos.set(0.6, 2.4, 5.0);
          this.targetLookAt.set(0.6, 1.4, 1.2);
        } else {
          this.targetCameraPos.set(0.6, 2.0, 4.0);
          this.targetLookAt.set(0.6, 1.4, 1.2);
        }
        break;

      case 'overall':
      default:
        if (isSideBySide) {
          this.targetCameraPos.set(2.0, 4.8, 8.8);
          this.targetLookAt.set(0.6, 1.3, -0.2);
        } else {
          this.targetCameraPos.set(2.5, 4.0, 7.5);
          this.targetLookAt.set(0.6, 1.3, -0.2);
        }
        break;
    }
    this.isCameraTransitioning = true;
  }

  toggleGuides() {
    this.guidesVisible = !this.guidesVisible;
    if (this.models.guidesSolitary) this.models.guidesSolitary.visible = this.guidesVisible;
    if (this.models.guidesGregarious) this.models.guidesGregarious.visible = this.guidesVisible;

    const btn = document.getElementById('btn-toggle-guides');
    if (btn) {
      btn.classList.toggle('active', this.guidesVisible);
      btn.querySelector('.label').textContent = this.guidesVisible ? '寸法線: 表示中' : '寸法線: 非表示';
    }
  }

  updateHUD() {
    const solM = this.models.solitary.userData.morphometrics;
    const gregM = this.models.gregarious.userData.morphometrics;

    const elSolEF = document.getElementById('hud-sol-ef');
    const elGregEF = document.getElementById('hud-greg-ef');
    const elSolWing = document.getElementById('hud-sol-wing');
    const elGregWing = document.getElementById('hud-greg-wing');
    const elSolFemur = document.getElementById('hud-sol-femur');
    const elGregFemur = document.getElementById('hud-greg-femur');

    if (elSolEF) elSolEF.textContent = (solM.wingLength / solM.femurLength).toFixed(2);
    if (elGregEF) elGregEF.textContent = (gregM.wingLength / gregM.femurLength).toFixed(2);
    if (elSolWing) elSolWing.textContent = `${(solM.wingLength * 10).toFixed(1)} mm`;
    if (elGregWing) elGregWing.textContent = `${(gregM.wingLength * 10).toFixed(1)} mm`;
    if (elSolFemur) elSolFemur.textContent = `${(solM.femurLength * 10).toFixed(1)} mm`;
    if (elGregFemur) elGregFemur.textContent = `${(gregM.femurLength * 10).toFixed(1)} mm`;
  }

  initUI() {
    // Mode tabs
    document.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Focus preset buttons
    document.querySelectorAll('[data-focus]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-focus]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setCameraPreset(btn.dataset.focus);
      });
    });

    // Toggle Guides
    const btnGuides = document.getElementById('btn-toggle-guides');
    if (btnGuides) {
      btnGuides.addEventListener('click', () => this.toggleGuides());
    }

    // Auto rotate toggle
    const btnRotate = document.getElementById('btn-toggle-rotate');
    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        this.controls.autoRotate = !this.controls.autoRotate;
        btnRotate.classList.toggle('active', this.controls.autoRotate);
      });
    }

    // Animation speed controls
    const speedSelect = document.getElementById('anim-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        this.animator.setSpeed(val);
      });
    }

    // AR Button
    const btnAR = document.getElementById('btn-launch-ar');
    if (btnAR) {
      btnAR.addEventListener('click', async () => {
        const statusEl = document.getElementById('ar-status-toast');
        if (statusEl) {
          statusEl.textContent = 'ARモデル（USDZ）を生成しています...';
          statusEl.classList.add('visible');
        }

        let targetExport = new THREE.Group();
        if (this.mode === 'solitary') {
          targetExport.add(this.models.solitary.clone(true));
        } else if (this.mode === 'gregarious') {
          targetExport.add(this.models.gregarious.clone(true));
        } else {
          const solClone = this.models.solitary.clone(true);
          const gregClone = this.models.gregarious.clone(true);
          solClone.position.set(-1.8, 0, 0);
          gregClone.position.set(1.8, 0, 0);
          targetExport.add(solClone);
          targetExport.add(gregClone);
        }

        await LocustARManager.launchAR(
          targetExport,
          `locust_${this.mode}.usdz`,
          (msg) => {
            if (statusEl) statusEl.textContent = msg;
          }
        );

        setTimeout(() => {
          if (statusEl) statusEl.classList.remove('visible');
        }, 3500);
      });
    }

    // HUD Collapse Toggle
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    const hudPanel = document.getElementById('hud-panel');
    if (btnToggleHud && hudPanel) {
      btnToggleHud.addEventListener('click', () => {
        hudPanel.classList.toggle('collapsed');
      });
    }

    // Reset Camera
    const btnResetCam = document.getElementById('btn-reset-cam');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        this.setCameraPreset('overall');
      });
    }

    // ----------------------------------------------------
    // Student Interactive Caliper & Measuring UI Handlers
    // ----------------------------------------------------
    const measureDeck = document.getElementById('measure-deck');
    const btnToggleMeasure = document.getElementById('btn-toggle-measure');
    if (btnToggleMeasure && measureDeck) {
      btnToggleMeasure.addEventListener('click', () => {
        measureDeck.classList.toggle('open');
        const isOpen = measureDeck.classList.contains('open');
        btnToggleMeasure.classList.toggle('active', isOpen);
        if (!isOpen) {
          this.measuringTool.clearAll();
        }
      });
    }

    // Specific part caliper buttons
    document.querySelectorAll('[data-caliper-part]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const part = btn.dataset.caliperPart;
        // Determine target model
        let target = this.models.solitary;
        const targetRadio = document.querySelector('input[name="caliper-target"]:checked');
        if (targetRadio && targetRadio.value === 'gregarious') {
          target = this.models.gregarious;
        } else if (this.mode === 'gregarious') {
          target = this.models.gregarious;
        }

        const res = this.measuringTool.measurePart(target, part);
        if (res) {
          // Focus camera on measured part
          this.setCameraPreset(part === 'wing' ? 'wings' : (part === 'femur' ? 'hindlegs' : (part === 'pronotum' ? 'pronotum' : 'overall')));
        }
      });
    });

    // Free 2-point laser measure toggle
    const btnLaserMeasure = document.getElementById('btn-laser-measure');
    if (btnLaserMeasure) {
      btnLaserMeasure.addEventListener('click', () => {
        const active = !this.measuringTool.isFreeMeasureActive;
        this.measuringTool.setFreeMeasureMode(active);
        btnLaserMeasure.classList.toggle('active', active);
        btnLaserMeasure.textContent = active ? '📍 2点タップ測定中 (タップで計測)' : '📍 自由2点タップ測定';
      });
    }

    // Clear measurements
    const btnClearMeasure = document.getElementById('btn-clear-measure');
    if (btnClearMeasure) {
      btnClearMeasure.addEventListener('click', () => {
        this.measuringTool.clearAll();
      });
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.models.solitary && this.models.solitary.visible) {
      this.animator.update(this.models.solitary, time, delta);
    }
    if (this.models.gregarious && this.models.gregarious.visible) {
      this.animator.update(this.models.gregarious, time + 1.25, delta);
    }

    if (this.isCameraTransitioning) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      this.controls.target.lerp(this.targetLookAt, 0.06);

      if (
        this.camera.position.distanceTo(this.targetCameraPos) < 0.04 &&
        this.controls.target.distanceTo(this.targetLookAt) < 0.04
      ) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetLookAt);
        this.isCameraTransitioning = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.locustApp = new LocustApp();
});
