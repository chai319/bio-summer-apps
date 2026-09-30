/**
 * locust_builder.js - High-Precision Procedural 3D Locust Anatomy Builder
 * Biologically accurate anatomical models for Locusta migratoria (Solitary & Gregarious phases)
 * Faithful to photographic specimen references.
 */

import * as THREE from 'three';
import { LocustTextureGenerator } from './textures.js';

export class LocustBuilder {
  /**
   * Builds a complete, anatomically articulated locust model.
   * @param {string} phase - 'solitary' or 'gregarious'
   * @returns {THREE.Group} The locust hierarchy with animated joint references.
   */
  static buildLocust(phase = 'solitary') {
    const isSolitary = phase === 'solitary';

    const locustGroup = new THREE.Group();
    locustGroup.name = `locust_${phase}`;

    // Morphometrics based on real biological measurements (1 unit = 10mm)
    const morphometrics = {
      phase: phase,
      bodyLength: isSolitary ? 4.5 : 4.3,      // Total body length ~45mm
      // Gregarious locusts have a somewhat wider head, but the difference is
      // morphometric rather than a conspicuous projection.
      headWidth: isSolitary ? 1.08 : 1.15,
      pronotumLength: isSolitary ? 1.3 : 1.15,
      pronotumHeight: isSolitary ? 0.82 : 0.72,
      pronotumForm: isSolitary ? 'gently_convex' : 'low_flat',
      femurLength: isSolitary ? 3.6 : 2.7,     // Solitary has very long jumping hind legs
      femurWidth: isSolitary ? 0.62 : 0.72,
      tibiaLength: isSolitary ? 3.65 : 2.75,   // Tibia matches femur length
      wingLength: isSolitary ? 3.9 : 5.4,      // Solitary reaches abdomen tip; Gregarious far exceeds it!
      efRatio: isSolitary ? 1.08 : 2.00
    };

    locustGroup.userData = {
      morphometrics: morphometrics,
      phase: phase,
      joints: {}
    };

    // Shared Materials with procedural textures
    const textures = {
      eye: LocustTextureGenerator.createEyeTexture(phase),
      pronotum: LocustTextureGenerator.createPronotumTexture(phase),
      wing: LocustTextureGenerator.createWingTexture(phase),
      femur: LocustTextureGenerator.createFemurTexture(phase),
      abdomen: LocustTextureGenerator.createAbdomenTexture(phase)
    };

    // Standard Chitin Materials
    const baseColor = isSolitary ? 0x48962b : 0x784224;
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.42,
      metalness: 0.08
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      map: textures.eye,
      roughness: 0.22,
      metalness: 0.12
    });

    const pronotumMaterial = new THREE.MeshStandardMaterial({
      map: textures.pronotum,
      roughness: 0.45,
      metalness: 0.05
    });

    const wingMaterial = new THREE.MeshStandardMaterial({
      map: textures.wing,
      roughness: 0.32,
      metalness: 0.04,
      transparent: true,
      opacity: isSolitary ? 0.88 : 0.94,
      side: THREE.DoubleSide
    });

    const hindWingMaterial = new THREE.MeshStandardMaterial({
      color: isSolitary ? 0xafe896 : 0xd8c29d,
      roughness: 0.45,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    const femurMaterial = new THREE.MeshStandardMaterial({
      map: textures.femur,
      roughness: 0.4,
      metalness: 0.06
    });

    // In specimen photos, solitary locust tibia is strikingly bright orange-vermilion!
    const tibiaColor = isSolitary ? 0xeb5914 : 0x8a3c18;
    const tibiaMaterial = new THREE.MeshStandardMaterial({
      color: tibiaColor,
      roughness: 0.44,
      metalness: 0.06
    });

    const kneeMaterial = new THREE.MeshStandardMaterial({
      color: 0x180f0a,
      roughness: 0.3,
      metalness: 0.12
    });

    const abdomenMaterial = new THREE.MeshStandardMaterial({
      map: textures.abdomen,
      roughness: 0.52,
      metalness: 0.04
    });

    // ----------------------------------------------------
    // 1. Thorax Main Base (Meso- & Metathorax)
    // ----------------------------------------------------
    const thoraxGroup = new THREE.Group();
    thoraxGroup.name = 'thorax';
    thoraxGroup.position.set(0, 1.45, 0);

    const thoraxGeo = new THREE.CylinderGeometry(0.72, 0.68, 1.4, 20);
    thoraxGeo.rotateX(Math.PI / 2);
    const thoraxMesh = new THREE.Mesh(thoraxGeo, bodyMaterial);
    thoraxMesh.scale.set(morphometrics.headWidth * 0.88, 1.15, 1.0);
    thoraxMesh.castShadow = true;
    thoraxMesh.receiveShadow = true;
    thoraxGroup.add(thoraxMesh);
    locustGroup.add(thoraxGroup);

    // ----------------------------------------------------
    // 2. Pronotum (前胸背板)
    // ----------------------------------------------------
    const pronotumGroup = new THREE.Group();
    pronotumGroup.name = 'pronotum';
    pronotumGroup.position.set(0, 1.55, 0.65);

    const pWidth = morphometrics.headWidth * 1.18;
    const pLength = morphometrics.pronotumLength * 1.4;
    const pHeight = morphometrics.pronotumHeight;

    // The previous half-cylinder produced a tall open edge that looked like a
    // curled sail from the left side. A pronotum is a low dorsal shield, so use
    // a closed, rounded capsule that follows the thorax instead.
    const capsuleRadius = 0.5;
    const capsuleBodyLength = Math.max(0.15, pLength - capsuleRadius * 2);
    const pGeo = new THREE.CapsuleGeometry(capsuleRadius, capsuleBodyLength, 12, 28);
    pGeo.rotateX(Math.PI / 2);
    pGeo.scale(pWidth, pHeight, 1);

    const pronotumMesh = new THREE.Mesh(pGeo, pronotumMaterial);
    pronotumMesh.castShadow = true;
    pronotumMesh.receiveShadow = true;
    pronotumGroup.add(pronotumMesh);

    // A subtle median keel conveys the solitary-phase convexity without
    // inventing a horn or a large head-like protrusion.
    const ridgeHeight = isSolitary ? 0.08 : 0.025;
    const ridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, pHeight * 0.48, -pLength * 0.40),
      new THREE.Vector3(0, pHeight * 0.50 + ridgeHeight, 0),
      new THREE.Vector3(0, pHeight * 0.48, pLength * 0.40)
    );
    const ridgeGeo = new THREE.TubeGeometry(ridgeCurve, 28, 0.018, 6, false);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, pronotumMaterial);
    ridgeMesh.castShadow = true;
    pronotumGroup.add(ridgeMesh);

    locustGroup.add(pronotumGroup);
    locustGroup.userData.pronotumGroup = pronotumGroup;

    // ----------------------------------------------------
    // 3. Head & Neck Joint (頭部・首関節)
    // ----------------------------------------------------
    const neckJoint = new THREE.Group();
    neckJoint.name = 'neck_joint';
    neckJoint.position.set(0, 1.42, 1.35);

    const headMeshGroup = new THREE.Group();
    headMeshGroup.name = 'head_group';

    const craniumGeo = new THREE.SphereGeometry(0.72, 22, 22);
    craniumGeo.scale(morphometrics.headWidth * 0.72, 1.18, 0.98);
    const craniumMesh = new THREE.Mesh(craniumGeo, bodyMaterial);
    craniumMesh.position.set(0, -0.22, 0);
    craniumMesh.castShadow = true;
    headMeshGroup.add(craniumMesh);

    const fronsGeo = new THREE.BoxGeometry(morphometrics.headWidth * 0.62, 0.72, 0.42);
    const fronsMesh = new THREE.Mesh(fronsGeo, bodyMaterial);
    fronsMesh.position.set(0, -0.48, 0.35);
    fronsMesh.rotation.x = -0.22;
    headMeshGroup.add(fronsMesh);

    const eyeRadius = isSolitary ? 0.38 : 0.44;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 20, 20);
    eyeGeo.scale(0.85, 1.35, 1.05);

    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial);
    eyeLeft.position.set(morphometrics.headWidth * 0.48, -0.08, 0.18);
    eyeLeft.rotation.set(0.1, 0.35, -0.15);
    eyeLeft.castShadow = true;
    headMeshGroup.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMaterial);
    eyeRight.position.set(-morphometrics.headWidth * 0.48, -0.08, 0.18);
    eyeRight.rotation.set(0.1, -0.35, 0.15);
    eyeRight.castShadow = true;
    headMeshGroup.add(eyeRight);

    // Mouthparts
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.88, 0.2);

    const labrumGeo = new THREE.BoxGeometry(0.38, 0.3, 0.25);
    const labrumMesh = new THREE.Mesh(labrumGeo, bodyMaterial);
    mouthGroup.add(labrumMesh);

    const palpGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.45, 8);
    palpGeo.rotateX(Math.PI / 3);

    const leftPalp = new THREE.Group();
    leftPalp.position.set(0.24, -0.1, 0.05);
    const leftPalpMesh = new THREE.Mesh(palpGeo, bodyMaterial);
    leftPalp.add(leftPalpMesh);
    mouthGroup.add(leftPalp);

    const rightPalp = new THREE.Group();
    rightPalp.position.set(-0.24, -0.1, 0.05);
    const rightPalpMesh = new THREE.Mesh(palpGeo, bodyMaterial);
    rightPalp.add(rightPalpMesh);
    mouthGroup.add(rightPalp);

    headMeshGroup.add(mouthGroup);

    // Antennae Chain
    const antennaSegments = 8;
    const antSegLength = 0.26;

    function createAntenna(side) {
      const rootJoint = new THREE.Group();
      rootJoint.position.set(side * (morphometrics.headWidth * 0.3), 0.22, 0.42);
      rootJoint.rotation.set(0.48, side * 0.18, 0);

      let currentParent = rootJoint;
      const chainNodes = [];

      for (let s = 0; s < antennaSegments; s++) {
        const segGroup = new THREE.Group();
        segGroup.position.set(0, antSegLength, 0);

        const rTop = 0.035 * (1.0 - (s / antennaSegments) * 0.6);
        const rBottom = 0.045 * (1.0 - (s / antennaSegments) * 0.6);
        const segGeo = new THREE.CylinderGeometry(rTop, rBottom, antSegLength, 8);
        segGeo.translate(0, antSegLength / 2, 0);

        const segMesh = new THREE.Mesh(segGeo, bodyMaterial);
        segGroup.add(segMesh);

        currentParent.add(segGroup);
        currentParent = segGroup;
        chainNodes.push(segGroup);
      }

      return { root: rootJoint, nodes: chainNodes };
    }

    const leftAntenna = createAntenna(1);
    const rightAntenna = createAntenna(-1);
    headMeshGroup.add(leftAntenna.root);
    headMeshGroup.add(rightAntenna.root);

    neckJoint.add(headMeshGroup);
    locustGroup.add(neckJoint);

    locustGroup.userData.joints.neck = neckJoint;
    locustGroup.userData.joints.leftAntenna = leftAntenna;
    locustGroup.userData.joints.rightAntenna = rightAntenna;
    locustGroup.userData.joints.leftPalp = leftPalp;
    locustGroup.userData.joints.rightPalp = rightPalp;

    // ----------------------------------------------------
    // 4. Abdomen (腹部)
    // ----------------------------------------------------
    const abdomenGroup = new THREE.Group();
    abdomenGroup.name = 'abdomen';
    abdomenGroup.position.set(0, 1.4, -0.65);

    const numAbdomenSegments = 10;
    const segLength = 0.31;
    const abdomenNodes = [];

    let abParent = abdomenGroup;
    for (let i = 0; i < numAbdomenSegments; i++) {
      const taper = 1.0 - (i / numAbdomenSegments) * 0.55;
      const node = new THREE.Group();
      node.position.set(0, -0.012 * i, -segLength);

      const aGeo = new THREE.CylinderGeometry(0.56 * taper, 0.61 * taper, segLength * 1.05, 18);
      aGeo.rotateX(Math.PI / 2);
      aGeo.scale(1.0, 1.25, 1.0);

      const aMesh = new THREE.Mesh(aGeo, abdomenMaterial);
      aMesh.castShadow = true;
      aMesh.receiveShadow = true;
      node.add(aMesh);

      abParent.add(node);
      abParent = node;
      abdomenNodes.push(node);
    }

    // Cerci
    const cercusGeo = new THREE.ConeGeometry(0.06, 0.38, 8);
    cercusGeo.rotateX(-Math.PI / 2);
    const leftCercus = new THREE.Mesh(cercusGeo, bodyMaterial);
    leftCercus.position.set(0.18, 0.05, -segLength);
    leftCercus.rotation.set(-0.2, 0.3, 0);
    abParent.add(leftCercus);

    const rightCercus = new THREE.Mesh(cercusGeo, bodyMaterial);
    rightCercus.position.set(-0.18, 0.05, -segLength);
    rightCercus.rotation.set(-0.2, -0.3, 0);
    abParent.add(rightCercus);

    locustGroup.add(abdomenGroup);
    locustGroup.userData.joints.abdomen = abdomenGroup;
    locustGroup.userData.joints.abdomenNodes = abdomenNodes;

    // ----------------------------------------------------
    // 5. Wings (翅)
    // ----------------------------------------------------
    const wingsGroup = new THREE.Group();
    wingsGroup.name = 'wings_group';
    wingsGroup.position.set(0, 1.7, -0.1);

    const wLen = morphometrics.wingLength;
    const wWidth = 0.88;

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(wWidth * 0.95, -wLen * 0.35, wWidth * 0.85, -wLen * 0.7);
    wingShape.quadraticCurveTo(wWidth * 0.5, -wLen * 0.96, 0, -wLen);
    wingShape.quadraticCurveTo(-0.06, -wLen * 0.6, 0, 0);

    const foreWingGeo = new THREE.ShapeGeometry(wingShape, 24);
    foreWingGeo.rotateX(Math.PI / 2);

    const wPos = foreWingGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      let x = wPos.getX(i);
      let y = -Math.sin((x / wWidth) * Math.PI) * 0.08;
      wPos.setY(i, y);
    }
    foreWingGeo.computeVertexNormals();

    const leftForeWing = new THREE.Mesh(foreWingGeo, wingMaterial);
    leftForeWing.position.set(0.14, 0.06, 0);
    leftForeWing.rotation.set(0.06, -0.05, -0.22);
    leftForeWing.castShadow = true;
    wingsGroup.add(leftForeWing);

    const rightForeWing = new THREE.Mesh(foreWingGeo, wingMaterial);
    rightForeWing.scale.set(-1, 1, 1);
    rightForeWing.position.set(-0.14, 0.06, 0);
    rightForeWing.rotation.set(0.06, 0.05, 0.22);
    rightForeWing.castShadow = true;
    wingsGroup.add(rightForeWing);

    const hindWingGeo = new THREE.PlaneGeometry(0.68, wLen * 0.94, 6, 12);
    hindWingGeo.rotateX(Math.PI / 2);
    hindWingGeo.translate(0.15, -0.05, -wLen * 0.46);

    const leftHindWing = new THREE.Mesh(hindWingGeo, hindWingMaterial);
    leftHindWing.rotation.set(0.07, -0.04, -0.26);
    wingsGroup.add(leftHindWing);

    const rightHindWing = new THREE.Mesh(hindWingGeo, hindWingMaterial);
    rightHindWing.scale.set(-1, 1, 1);
    rightHindWing.rotation.set(0.07, 0.04, 0.26);
    wingsGroup.add(rightHindWing);

    locustGroup.add(wingsGroup);
    locustGroup.userData.wingsGroup = wingsGroup;

    // ----------------------------------------------------
    // 6. Walking Legs: Forelegs & Midlegs
    // ----------------------------------------------------
    function createWalkingLeg(isMidLeg = false, side = 1) {
      const legGroup = new THREE.Group();
      const zOffset = isMidLeg ? -0.15 : 0.45;
      legGroup.position.set(side * 0.58, 1.25, zOffset);

      const coxaGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const coxa = new THREE.Mesh(coxaGeo, bodyMaterial);
      legGroup.add(coxa);

      const femurGroup = new THREE.Group();
      const legFemurLen = isMidLeg ? 1.35 : 1.15;
      const legFemurGeo = new THREE.CylinderGeometry(0.09, 0.07, legFemurLen, 8);
      legFemurGeo.translate(0, -legFemurLen / 2, 0);
      const fMesh = new THREE.Mesh(legFemurGeo, bodyMaterial);
      femurGroup.add(fMesh);

      const tibiaGroup = new THREE.Group();
      tibiaGroup.position.set(0, -legFemurLen, 0);
      const legTibiaLen = isMidLeg ? 1.45 : 1.25;
      const legTibiaGeo = new THREE.CylinderGeometry(0.06, 0.05, legTibiaLen, 8);
      legTibiaGeo.translate(0, -legTibiaLen / 2, 0);
      const tMesh = new THREE.Mesh(legTibiaGeo, tibiaMaterial);
      tibiaGroup.add(tMesh);

      const tarsusGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.4, 6);
      tarsusGeo.translate(0, -0.2, 0);
      const tarsusMesh = new THREE.Mesh(tarsusGeo, bodyMaterial);
      tarsusMesh.position.set(0, -legTibiaLen, 0);
      tarsusMesh.rotation.x = Math.PI / 4;
      tibiaGroup.add(tarsusMesh);

      femurGroup.add(tibiaGroup);
      legGroup.add(femurGroup);

      if (!isMidLeg) {
        legGroup.rotation.set(0.3, side * 0.4, -side * 0.45);
        femurGroup.rotation.set(-0.2, 0, -side * 0.3);
        tibiaGroup.rotation.set(0.7, 0, side * 0.4);
      } else {
        legGroup.rotation.set(-0.15, -side * 0.25, -side * 0.55);
        femurGroup.rotation.set(0.2, 0, -side * 0.2);
        tibiaGroup.rotation.set(0.65, 0, side * 0.35);
      }

      return { root: legGroup, femur: femurGroup, tibia: tibiaGroup };
    }

    const leftForeLeg = createWalkingLeg(false, 1);
    const rightForeLeg = createWalkingLeg(false, -1);
    const leftMidLeg = createWalkingLeg(true, 1);
    const rightMidLeg = createWalkingLeg(true, -1);

    locustGroup.add(leftForeLeg.root);
    locustGroup.add(rightForeLeg.root);
    locustGroup.add(leftMidLeg.root);
    locustGroup.add(rightMidLeg.root);

    // ----------------------------------------------------
    // 7. Hind Legs (跳躍後脚) - True Biological Apex Posture (∧-Shape)
    // ----------------------------------------------------
    // MATHEMATICALLY VERIFIED ORIENTATION (No upside-down inversion):
    // 1. Femur rises from thorax base (y=1.2) BACKWARD (-Z) and UPWARD (+Y).
    //    Rotation X is POSITIVE (+Math.PI * 0.34) so +Y vector goes UP and BACKWARD!
    // 2. Knee sits at the APEX summit (y ~ 3.0), the highest point of the body.
    // 3. Tibia sharply folds at knee by +155 degrees so it points FORWARD and DOWNWARD to ground!
    // 4. Tarsus lands flat on the ground (y=0) beside the body pointing forward.
    function createHindLeg(side = 1) {
      const hindLegGroup = new THREE.Group();
      hindLegGroup.name = `hind_leg_${side > 0 ? 'left' : 'right'}`;

      const fLen = morphometrics.femurLength; // Solitary: 3.6, Gregarious: 2.7
      const tLen = morphometrics.tibiaLength; // Solitary: 3.65, Gregarious: 2.75
      const fWidth = morphometrics.femurWidth;

      // Base point on thorax side
      const basePos = new THREE.Vector3(side * 0.65, 1.25, -0.3);
      hindLegGroup.position.copy(basePos);

      // --- FEMUR (大腿部 / 腿節) ---
      // Negative pitch rotation around X (-Math.PI * 0.28 = ~ -50.4 degrees):
      // Initial +Y vector (0, 1, 0) rotates around X:
      // New Y = +cos(-50.4 deg) = +0.637 (POINTS UPWARD!)
      // New Z = +sin(-50.4 deg) = -0.771 (POINTS BACKWARD!)
      // Result: Femur rises from base (y=1.25) to knee (y=3.54), sloping backward!
      const femurPitch = -Math.PI * 0.28;
      const femurYaw = side * 0.12;       // splayed slightly outward
      const femurRoll = -side * 0.08;      // slightly tilted

      const femurRoot = new THREE.Group();
      femurRoot.name = 'femur_root';
      femurRoot.rotation.set(femurPitch, femurYaw, femurRoll);

      // Muscular laterally compressed thigh shape
      const femurShape = new THREE.Shape();
      femurShape.moveTo(0, 0);
      femurShape.quadraticCurveTo(fWidth * 0.95, fLen * 0.35, fWidth * 0.72, fLen * 0.75);
      femurShape.quadraticCurveTo(fWidth * 0.35, fLen * 0.96, 0, fLen); // Apex at Knee
      femurShape.quadraticCurveTo(-fWidth * 0.32, fLen * 0.6, 0, 0);

      const femurGeo = new THREE.ExtrudeGeometry(femurShape, {
        depth: 0.28,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.08,
        bevelThickness: 0.06
      });
      femurGeo.center();
      // Rotate 90 deg around Y so the wide flat muscular surface faces laterally outwards
      femurGeo.rotateY(Math.PI / 2);
      femurGeo.translate(0, fLen / 2, 0); // Base at (0, 0, 0), Knee at (0, fLen, 0)

      const femurMesh = new THREE.Mesh(femurGeo, femurMaterial);
      femurMesh.castShadow = true;
      femurRoot.add(femurMesh);

      // Black band marking just proximal to knee cap (seen in photo)
      const kneeBandGeo = new THREE.CylinderGeometry(fWidth * 0.38, fWidth * 0.44, 0.45, 12);
      const kneeBandMesh = new THREE.Mesh(kneeBandGeo, kneeMaterial);
      kneeBandMesh.position.set(0, fLen * 0.88, 0);
      femurRoot.add(kneeBandMesh);

      // --- KNEE APEX (膝関節キャップ - 最高点！) ---
      const kneeJoint = new THREE.Group();
      kneeJoint.name = 'knee_joint';
      kneeJoint.position.set(0, fLen, 0); // Top of the femur!

      const kneeGeo = new THREE.SphereGeometry(0.2, 14, 14);
      kneeGeo.scale(0.9, 1.1, 1.25);
      const kneeMesh = new THREE.Mesh(kneeGeo, kneeMaterial);
      kneeMesh.castShadow = true;
      kneeJoint.add(kneeMesh);

      // --- TIBIA (脛節 / すね) ---
      // Folds forward and down toward the floor UNDER the femur!
      // In femur local coordinates, rotating around X by -Math.PI * 0.88 (~ -158 deg):
      // Vector flips to point forward-downward toward the floor underneath the femur!
      const tibiaRoot = new THREE.Group();
      tibiaRoot.name = 'tibia_root';
      tibiaRoot.rotation.set(-Math.PI * 0.88, 0, side * 0.04);

      // Tibia rod extends along local +Y from knee
      const tibiaGeo = new THREE.CylinderGeometry(0.065, 0.08, tLen, 10);
      tibiaGeo.translate(0, tLen / 2, 0);
      const tibiaMesh = new THREE.Mesh(tibiaGeo, tibiaMaterial);
      tibiaMesh.castShadow = true;
      tibiaRoot.add(tibiaMesh);

      // Spines along posterior / dorsal ridge of tibia (facing backwards/outwards away from femur)
      const numSpines = 11;
      const spineGeo = new THREE.ConeGeometry(0.04, 0.16, 5);
      spineGeo.rotateZ(Math.PI / 2);
      const spineMat = new THREE.MeshStandardMaterial({ color: 0x110804, roughness: 0.3 });

      for (let s = 1; s < numSpines; s++) {
        const spineY = (tLen / numSpines) * s;
        // Spines point backward/outward
        const spLeft = new THREE.Mesh(spineGeo, spineMat);
        spLeft.position.set(0.07, spineY, -0.04);
        spLeft.rotation.y = 0.25;
        tibiaRoot.add(spLeft);

        const spRight = new THREE.Mesh(spineGeo, spineMat);
        spRight.position.set(-0.07, spineY, -0.04);
        spRight.rotation.z = Math.PI;
        spRight.rotation.y = -0.25;
        tibiaRoot.add(spRight);
      }

      // --- TARSUS (跗節 / 足先) ---
      // Lands on the floor and points forward
      const tarsusGroup = new THREE.Group();
      tarsusGroup.position.set(0, tLen, 0);
      tarsusGroup.rotation.set(Math.PI * 0.42, 0, 0);

      const hTarsusGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.65, 8);
      hTarsusGeo.translate(0, 0.3, 0);
      const hTarsusMesh = new THREE.Mesh(hTarsusGeo, bodyMaterial);
      tarsusGroup.add(hTarsusMesh);

      // Claws
      const clawGeo = new THREE.ConeGeometry(0.03, 0.12, 4);
      clawGeo.rotateX(Math.PI / 2);
      const clawL = new THREE.Mesh(clawGeo, kneeMaterial);
      clawL.position.set(0.03, 0.6, 0.05);
      tarsusGroup.add(clawL);
      const clawR = new THREE.Mesh(clawGeo, kneeMaterial);
      clawR.position.set(-0.03, 0.6, 0.05);
      tarsusGroup.add(clawR);

      tibiaRoot.add(tarsusGroup);
      kneeJoint.add(tibiaRoot);
      femurRoot.add(kneeJoint);
      hindLegGroup.add(femurRoot);

      return {
        root: hindLegGroup,
        femur: femurRoot,
        knee: kneeJoint,
        tibia: tibiaRoot,
        tarsus: tarsusGroup
      };
    }

    const leftHindLeg = createHindLeg(1);
    const rightHindLeg = createHindLeg(-1);
    locustGroup.add(leftHindLeg.root);
    locustGroup.add(rightHindLeg.root);

    locustGroup.userData.joints.leftHindLeg = leftHindLeg;
    locustGroup.userData.joints.rightHindLeg = rightHindLeg;

    return locustGroup;
  }
}
