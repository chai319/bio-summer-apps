/**
 * textures.js - Procedural Texture Generator for Locust Phases
 * Generates realistic chitin textures for Solitary and Gregarious phases using HTML5 Canvas.
 */

import * as THREE from 'three';

export class LocustTextureGenerator {
  /**
   * Generates compound eye texture with ommatidia and phase coloration.
   * @param {string} phase - 'solitary' or 'gregarious'
   */
  static createEyeTexture(phase) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const isSolitary = phase === 'solitary';

    // Base background
    const bgGrad = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
    if (isSolitary) {
      bgGrad.addColorStop(0, '#7ea938');
      bgGrad.addColorStop(0.7, '#4e751d');
      bgGrad.addColorStop(1, '#2d4710');
    } else {
      bgGrad.addColorStop(0, '#5a301a');
      bgGrad.addColorStop(0.7, '#24140b');
      bgGrad.addColorStop(1, '#110905');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Gregarious eyes have distinct vertical dark bands (pseudopupils / stripes)
    if (!isSolitary) {
      ctx.fillStyle = 'rgba(15, 8, 4, 0.75)';
      const stripeWidth = 40;
      for (let x = 60; x < 512; x += 90) {
        ctx.beginPath();
        ctx.ellipse(x, 256, stripeWidth / 2, 230, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Micro-hexagonal ommatidia grid overlay
    ctx.strokeStyle = isSolitary ? 'rgba(170, 220, 80, 0.12)' : 'rgba(210, 140, 80, 0.1)';
    ctx.lineWidth = 1;
    const hexRadius = 6;
    const h = hexRadius * Math.sqrt(3);

    for (let y = 0; y < 512 + h; y += h) {
      let xOffset = (Math.floor(y / h) % 2) * (hexRadius * 1.5);
      for (let x = xOffset; x < 512 + hexRadius * 2; x += hexRadius * 3) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = x + hexRadius * Math.cos(angle);
          const hy = y + hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Specular highlight glossiness
    const glossGrad = ctx.createLinearGradient(100, 50, 400, 450);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    glossGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates pronotum (saddle/shield) texture.
   * @param {string} phase - 'solitary' or 'gregarious'
   */
  static createPronotumTexture(phase) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const isSolitary = phase === 'solitary';

    if (isSolitary) {
      // Solitary: Lush vivid grass green, delicate dorsal crest highlight
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#2e6b22');
      grad.addColorStop(0.35, '#489432');
      grad.addColorStop(0.5, '#5bb83f'); // Bright dorsal keel
      grad.addColorStop(0.65, '#489432');
      grad.addColorStop(1, '#2e6b22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine chitin stippling
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 1.2));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.8));
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      // Gregarious: Dark brownish-black with striking orange/yellow lateral blotches
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#28170e');
      grad.addColorStop(0.2, '#6b3614');
      grad.addColorStop(0.35, '#d47b1f'); // Bright warning orange patch
      grad.addColorStop(0.48, '#180f09'); // Mid-dorsal dark depression
      grad.addColorStop(0.52, '#180f09');
      grad.addColorStop(0.65, '#d47b1f'); // Symmetrical orange patch
      grad.addColorStop(0.8, '#6b3614');
      grad.addColorStop(1, '#28170e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Bold black longitudinal stripes (carina band)
      ctx.fillStyle = 'rgba(12, 6, 3, 0.85)';
      ctx.fillRect(480, 0, 64, 1024);

      // Irregular dark markings on the sides
      ctx.fillStyle = 'rgba(20, 10, 5, 0.7)';
      for (let i = 0; i < 40; i++) {
        const x = Math.random() < 0.5 ? 150 + Math.random() * 200 : 674 + Math.random() * 200;
        const y = Math.random() * 1024;
        const rw = 20 + Math.random() * 60;
        const rh = 10 + Math.random() * 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chitin rough texture noise
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(0, data[i] + noise * 1.2));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates forewing (tegmen) texture with longitudinal veins, crossvein reticulum, and phase spots.
   * @param {string} phase - 'solitary' or 'gregarious'
   */
  static createWingTexture(phase) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const isSolitary = phase === 'solitary';

    // Base membrane
    if (isSolitary) {
      // Solitary: Semi-translucent fresh green
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, 'rgba(85, 155, 60, 0.95)');
      grad.addColorStop(0.5, 'rgba(105, 185, 75, 0.85)');
      grad.addColorStop(1, 'rgba(125, 195, 90, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);
    } else {
      // Gregarious: Smoky amber-brown with cloudy patches
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, 'rgba(70, 42, 22, 0.96)');
      grad.addColorStop(0.4, 'rgba(110, 75, 42, 0.88)');
      grad.addColorStop(0.8, 'rgba(145, 108, 68, 0.8)');
      grad.addColorStop(1, 'rgba(165, 128, 85, 0.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Characteristic dark clouds and leopard-like spots
      ctx.fillStyle = 'rgba(25, 14, 8, 0.75)';
      for (let i = 0; i < 90; i++) {
        const x = 120 + Math.random() * 850;
        const y = 40 + Math.random() * 432;
        const rx = 15 + Math.random() * 35;
        const ry = 8 + Math.random() * 20;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Longitudinal main veins (Costa, Subcosta, Radius, Media, Cubitus)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = isSolitary ? 'rgba(40, 100, 30, 0.85)' : 'rgba(30, 15, 8, 0.9)';

    const numVeins = 12;
    for (let i = 0; i < numVeins; i++) {
      const startY = 40 + i * (430 / numVeins);
      ctx.beginPath();
      ctx.moveTo(0, startY);
      const cp1x = 300, cp1y = startY + (Math.sin(i) * 30);
      const cp2x = 700, cp2y = startY + (Math.cos(i) * 20);
      const endY = startY * 0.85 + 40;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 1024, endY);
      ctx.stroke();
    }

    // Dense crossvein network (reticulum)
    ctx.lineWidth = 1;
    ctx.strokeStyle = isSolitary ? 'rgba(50, 120, 40, 0.35)' : 'rgba(40, 20, 10, 0.4)';
    for (let x = 40; x < 1024; x += 16) {
      for (let y = 30; y < 480; y += 22) {
        ctx.beginPath();
        ctx.moveTo(x + (Math.random() - 0.5) * 6, y);
        ctx.lineTo(x + 14 + (Math.random() - 0.5) * 6, y + 20);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates hind leg femur texture with characteristic chevron muscle patterns.
   * @param {string} phase - 'solitary' or 'gregarious'
   */
  static createFemurTexture(phase) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const isSolitary = phase === 'solitary';

    if (isSolitary) {
      // Solitary: Bright uniform grass-green with soft chevron ridges
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#53a836');
      grad.addColorStop(0.5, '#75c94e');
      grad.addColorStop(1, '#3d8225');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Subtle chevron ridges
      ctx.strokeStyle = 'rgba(45, 95, 25, 0.4)';
      ctx.lineWidth = 3;
      for (let x = 100; x < 950; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x + 45, 256);
        ctx.lineTo(x, 412);
        ctx.stroke();
      }
    } else {
      // Gregarious: Orange-brown with distinct black chevron bands
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#5a2d12');
      grad.addColorStop(0.3, '#c26b20');
      grad.addColorStop(0.6, '#e0882e');
      grad.addColorStop(1, '#4a240e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Outer side black patches
      ctx.fillStyle = 'rgba(18, 9, 4, 0.85)';
      ctx.beginPath();
      ctx.ellipse(320, 256, 120, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(650, 256, 140, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bold chevron muscle ridges with black contrast lines
      ctx.strokeStyle = 'rgba(15, 6, 2, 0.8)';
      ctx.lineWidth = 5;
      for (let x = 80; x < 950; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 90);
        ctx.lineTo(x + 50, 256);
        ctx.lineTo(x, 420);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates abdominal segment texture.
   * @param {string} phase - 'solitary' or 'gregarious'
   */
  static createAbdomenTexture(phase) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const isSolitary = phase === 'solitary';

    if (isSolitary) {
      // Solitary: Light yellowish-green segments
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#4e8f32');
      grad.addColorStop(0.5, '#72b84a');
      grad.addColorStop(1, '#8ed465');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Segment divisions
      ctx.strokeStyle = 'rgba(35, 75, 20, 0.7)';
      ctx.lineWidth = 4;
      for (let x = 80; x < 1000; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
    } else {
      // Gregarious: Dark brownish-amber with darker tergite margins
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#4a2914');
      grad.addColorStop(0.5, '#7a4823');
      grad.addColorStop(1, '#a66b37');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Dark segment bands and spiracles (breathing pores)
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.9)';
      ctx.lineWidth = 6;
      for (let x = 80; x < 1000; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();

        // Spiracle dark dot
        ctx.fillStyle = '#0f0603';
        ctx.beginPath();
        ctx.arc(x + 45, 256, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
