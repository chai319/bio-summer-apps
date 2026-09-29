/**
 * measurement_tool.js - Interactive 3D Caliper and Measuring Tool for Students
 * Allows students to physically measure morphological dimensions of 3D locusts.
 */

import * as THREE from 'three';

export class LocustMeasurementTool {
  constructor(scene, camera, renderer, controls) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;

    this.activeCaliper = null;
    this.measureGroup = new THREE.Group();
    this.measureGroup.name = 'interactive_measuring_tools';
    this.scene.add(this.measureGroup);

    // Free point-to-point measuring state
    this.isFreeMeasureActive = false;
    this.pickedPoints = [];
    this.laserLine = null;
    this.laserMarkers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initEvents();
  }

  initEvents() {
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (!this.isFreeMeasureActive) return;
      this.handleFreeMeasureClick(e);
    });
  }

  setFreeMeasureMode(active) {
    this.isFreeMeasureActive = active;
    this.clearFreeMeasure();
  }

  clearFreeMeasure() {
    this.pickedPoints = [];
    if (this.laserLine) {
      this.measureGroup.remove(this.laserLine);
      this.laserLine = null;
    }
    this.laserMarkers.forEach((m) => this.measureGroup.remove(m));
    this.laserMarkers = [];

    const readout = document.getElementById('measure-readout');
    if (readout) readout.textContent = '3Dモデル上の測りたい2点をタップしてください';
  }

  handleFreeMeasureClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    // Find intersection with locust meshes
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    const validHit = intersects.find((hit) => {
      return (
        hit.object.isMesh &&
        hit.object.name !== 'floor' &&
        hit.object.parent?.name !== 'measurement_guides' &&
        hit.object.parent?.name !== 'interactive_measuring_tools'
      );
    });

    if (!validHit) return;

    const hitPoint = validHit.point.clone();

    // Create bright marker sphere
    const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(hitPoint);
    this.measureGroup.add(marker);
    this.laserMarkers.push(marker);

    this.pickedPoints.push(hitPoint);

    if (this.pickedPoints.length === 1) {
      const readout = document.getElementById('measure-readout');
      if (readout) readout.textContent = '点1を記録。次の2点目をタップしてください...';
    } else if (this.pickedPoints.length === 2) {
      const p1 = this.pickedPoints[0];
      const p2 = this.pickedPoints[1];

      // Draw measurement laser line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.1,
        gapSize: 0.05,
        linewidth: 3
      });
      this.laserLine = new THREE.Line(lineGeo, lineMat);
      this.laserLine.computeLineDistances();
      this.measureGroup.add(this.laserLine);

      // Distance in mm (1 3D unit = 10mm)
      const distUnits = p1.distanceTo(p2);
      const distMm = (distUnits * 10).toFixed(1);

      // Distance Label Sprite
      const sprite = this.createMeasurementSprite(`${distMm} mm`);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      sprite.position.copy(mid).add(new THREE.Vector3(0, 0.25, 0));
      this.measureGroup.add(sprite);
      this.laserMarkers.push(sprite);

      const readout = document.getElementById('measure-readout');
      if (readout) {
        readout.innerHTML = `測定結果: <strong style="color: #38bdf8; font-size: 16px;">${distMm} mm</strong>`;
      }

      // Ready for new pair on next click
      this.pickedPoints = [];
    }
  }

  /**
   * Applies a precision 3D virtual caliper around a specific anatomical part.
   * @param {THREE.Group} targetLocust - Active locust group
   * @param {string} partName - 'wing', 'femur', 'pronotum', 'body'
   */
  measurePart(targetLocust, partName) {
    this.clearCaliper();

    const m = targetLocust.userData.morphometrics;
    if (!m) return;

    let pStart, pEnd, labelText, measuredValMm;
    const locustPos = targetLocust.position;
    const xBase = locustPos.x;

    if (partName === 'wing') {
      // Forewing length: from wing base to wing tip
      pStart = new THREE.Vector3(xBase + 0.85, 1.75, -0.1);
      pEnd = new THREE.Vector3(xBase + 0.85, 1.75, -0.1 - m.wingLength);
      measuredValMm = (m.wingLength * 10).toFixed(1);
      labelText = `前翅長 (E): ${measuredValMm} mm`;
    } else if (partName === 'femur') {
      // Hind femur: from base to knee
      pStart = new THREE.Vector3(xBase + 1.1, 1.25, -0.3);
      const kneeZ = -0.3 - m.femurLength * 0.848;
      const kneeY = 1.25 + m.femurLength * 0.53;
      pEnd = new THREE.Vector3(xBase + 1.1, kneeY, kneeZ);
      measuredValMm = (m.femurLength * 10).toFixed(1);
      labelText = `後脚腿節長 (F): ${measuredValMm} mm`;
    } else if (partName === 'pronotum') {
      // Pronotum length
      const pLen = m.pronotumLength * 1.4;
      pStart = new THREE.Vector3(xBase, 2.3, 0.65 + pLen / 2);
      pEnd = new THREE.Vector3(xBase, 2.3, 0.65 - pLen / 2);
      measuredValMm = (pLen * 10).toFixed(1);
      labelText = `前胸背板長: ${measuredValMm} mm`;
    } else if (partName === 'body') {
      // Head to abdomen tip
      pStart = new THREE.Vector3(xBase, 1.4, 1.7);
      const abdTipZ = -0.65 - (10 * 0.31);
      pEnd = new THREE.Vector3(xBase, 1.4, abdTipZ);
      measuredValMm = ((1.7 - abdTipZ) * 10).toFixed(1);
      labelText = `体長 (頭〜腹端): ${measuredValMm} mm`;
    }

    const caliperGroup = this.buildCaliperMesh(pStart, pEnd, labelText);
    this.measureGroup.add(caliperGroup);
    this.activeCaliper = caliperGroup;

    // Update UI readout
    const readout = document.getElementById('measure-readout');
    if (readout) {
      readout.innerHTML = `測定: <strong>${labelText}</strong>`;
    }

    return { part: partName, valueMm: parseFloat(measuredValMm) };
  }

  buildCaliperMesh(pStart, pEnd, labelText) {
    const group = new THREE.Group();
    group.name = 'virtual_caliper';

    const dir = new THREE.Vector3().subVectors(pEnd, pStart);
    const length = dir.length();
    const normDir = dir.clone().normalize();

    // Main ruler beam
    const beamGeo = new THREE.BoxGeometry(0.08, 0.08, length);
    beamGeo.translate(0, 0, length / 2);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      metalness: 0.6,
      roughness: 0.3
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(pStart);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normDir);
    group.add(beam);

    // Caliper Jaws (挟み込むアゴ)
    const jawGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06);
    jawGeo.translate(0, -0.22, 0);
    const jawMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.7,
      roughness: 0.25
    });

    const startJaw = new THREE.Mesh(jawGeo, jawMat);
    startJaw.position.copy(pStart);
    startJaw.quaternion.copy(beam.quaternion);
    group.add(startJaw);

    const endJaw = new THREE.Mesh(jawGeo, jawMat);
    endJaw.position.copy(pEnd);
    endJaw.quaternion.copy(beam.quaternion);
    group.add(endJaw);

    // 3D Measurement Value Label Sprite
    const sprite = this.createMeasurementSprite(labelText);
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    sprite.position.copy(mid).add(new THREE.Vector3(0, 0.35, 0));
    group.add(sprite);

    return group;
  }

  createMeasurementSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.roundRect(4, 4, 312, 64, 14);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 36);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.36, 1);
    return sprite;
  }

  clearCaliper() {
    if (this.activeCaliper) {
      this.measureGroup.remove(this.activeCaliper);
      this.activeCaliper = null;
    }
  }

  clearAll() {
    this.clearCaliper();
    this.clearFreeMeasure();
  }
}
