/**
 * guides.js - 3D Morphometric Measurement Guides & Anatomy Annotations
 * Renders dimensional arrows, measurement lines, and anatomical landmark highlights.
 */

import * as THREE from 'three';

export class LocustGuides {
  /**
   * Creates 3D measurement guide overlay for a locust.
   * @param {THREE.Group} locust - Locust group
   * @returns {THREE.Group} Guide visual elements
   */
  static createMeasurementGuides(locust) {
    const guideGroup = new THREE.Group();
    guideGroup.name = 'measurement_guides';
    const m = locust.userData.morphometrics;
    if (!m) return guideGroup;

    const isSolitary = m.phase === 'solitary';
    const colorWing = 0x38bdf8;   // Bright Cyan
    const colorFemur = 0xf59e0b;  // Amber Gold
    const colorCrest = 0xec4899;  // Magenta
    const colorAbdomen = 0x10b981;// Emerald Green

    // ----------------------------------------------------
    // Helper: 3D Dimension Arrow Line with End Ticks
    // ----------------------------------------------------
    function createDimensionLine(pStart, pEnd, color, labelText) {
      const g = new THREE.Group();

      const lineGeo = new THREE.BufferGeometry().setFromPoints([pStart, pEnd]);
      const lineMat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      g.add(line);

      // Start & End Cone Arrows
      const dir = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
      const arrowGeo = new THREE.ConeGeometry(0.08, 0.22, 8);
      const arrowMat = new THREE.MeshBasicMaterial({ color: color });

      const arrowEnd = new THREE.Mesh(arrowGeo, arrowMat);
      arrowEnd.position.copy(pEnd);
      arrowEnd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(arrowEnd);

      const arrowStart = new THREE.Mesh(arrowGeo, arrowMat);
      arrowStart.position.copy(pStart);
      arrowStart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
      g.add(arrowStart);

      // 3D Canvas Sprite for Label Text
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.roundRect(4, 4, 248, 56, 12);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 128, 32);

      const spriteTexture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: spriteTexture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
      sprite.position.copy(mid).add(new THREE.Vector3(0, 0.25, 0));
      sprite.scale.set(1.4, 0.35, 1);
      g.add(sprite);

      return g;
    }

    // 1. Wing Length (E: Elytron) - Offset laterally
    const wingStart = new THREE.Vector3(0.9, 1.85, -0.1);
    const wingEnd = new THREE.Vector3(0.9, 1.85, -0.1 - m.wingLength);
    const wingGuide = createDimensionLine(
      wingStart,
      wingEnd,
      colorWing,
      `翅長 (E): ${(m.wingLength * 10).toFixed(1)}mm`
    );
    guideGroup.add(wingGuide);

    // Abdomen Tip Reference Line (To visibly see how far wings extend beyond abdomen)
    const abdTipZ = -0.65 - (10 * 0.32); // Abdomen tip z ~ -3.85
    const refLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 1.85, abdTipZ),
      new THREE.Vector3(1.2, 1.85, abdTipZ)
    ]);
    const refLineMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 2
    });
    const refLine = new THREE.Line(refLineGeo, refLineMat);
    refLine.computeLineDistances();
    guideGroup.add(refLine);

    // Abdomen reference text
    const canvasAbd = document.createElement('canvas');
    canvasAbd.width = 256;
    canvasAbd.height = 64;
    const ctxAbd = canvasAbd.getContext('2d');
    ctxAbd.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctxAbd.roundRect(4, 4, 248, 56, 12);
    ctxAbd.fill();
    ctxAbd.fillStyle = '#ffffff';
    ctxAbd.font = 'bold 22px sans-serif';
    ctxAbd.textAlign = 'center';
    ctxAbd.textBaseline = 'middle';
    ctxAbd.fillText('腹部末端基準線', 128, 32);

    const refSpriteMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvasAbd),
      depthTest: false
    });
    const refSprite = new THREE.Sprite(refSpriteMat);
    refSprite.position.set(-1.4, 2.05, abdTipZ);
    refSprite.scale.set(1.4, 0.35, 1);
    guideGroup.add(refSprite);

    // 2. Hind Femur Length (F: Femur)
    const femurBase = new THREE.Vector3(1.1, 1.25, -0.3);
    const kneeZ = -0.3 - m.femurLength * 0.848;
    const kneeY = 1.25 + m.femurLength * 0.53;
    const femurEnd = new THREE.Vector3(1.1, kneeY, kneeZ);
    const femurGuide = createDimensionLine(
      femurBase,
      femurEnd,
      colorFemur,
      `後脚腿節 (F): ${(m.femurLength * 10).toFixed(1)}mm`
    );
    guideGroup.add(femurGuide);

    // 3. Pronotum Contour Indicator (Crest vs Saddle)
    const crestCanvas = document.createElement('canvas');
    crestCanvas.width = 256;
    crestCanvas.height = 64;
    const ctxC = crestCanvas.getContext('2d');
    ctxC.fillStyle = isSolitary ? 'rgba(74, 222, 128, 0.9)' : 'rgba(249, 115, 22, 0.9)';
    ctxC.roundRect(4, 4, 248, 56, 12);
    ctxC.fill();
    ctxC.fillStyle = '#000000';
    ctxC.font = 'bold 22px sans-serif';
    ctxC.textAlign = 'center';
    ctxC.textBaseline = 'middle';
    ctxC.fillText(isSolitary ? '前胸背板: なだらかな凸型' : '前胸背板: 低く平たい', 128, 32);

    const crestSpriteMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(crestCanvas),
      depthTest: false
    });
    const crestSprite = new THREE.Sprite(crestSpriteMat);
    crestSprite.position.set(0, 2.65, 0.65);
    crestSprite.scale.set(1.6, 0.4, 1);
    guideGroup.add(crestSprite);

    guideGroup.visible = false; // Off by default, toggled via UI
    return guideGroup;
  }
}
