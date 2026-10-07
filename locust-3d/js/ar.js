/**
 * ar.js - AR Quick Look (iOS / iPadOS) & USDZ Exporter System
 * Enables real-world augmented reality viewing on iPad with native Apple Quick Look.
 */

import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

export class LocustARManager {
  /**
   * Checks if current device supports Apple AR Quick Look.
   */
  static isIOSorIPad() {
    const ua = navigator.userAgent;
    const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone|iPod/.test(ua);
    return isIPad || isIPhone;
  }

  /**
   * Exports the target 3D locust object to USDZ and launches iOS AR Quick Look or triggers download.
   * @param {THREE.Object3D} targetObject - The locust or scene group to export
   * @param {string} filename - Output usdz filename
   * @param {Function} onProgress - Progress/status callback
   */
  static async launchAR(targetObject, filename = 'locust_model.usdz', onProgress = null) {
    if (onProgress) onProgress('ARモデル（USDZ）を生成中...');

    try {
      const exporter = new USDZExporter();

      // Clone target so that live animation / guides are not disrupted
      const exportClone = targetObject.clone(true);

      // Hide non-geometry helpers and fix negative scales for USDZExporter
      exportClone.traverse((child) => {
        if (child.name === 'measurement_guides' || child.isSprite || child.isLine) {
          child.visible = false;
        }
        if (child.isMesh && child.geometry && (child.scale.x < 0 || child.scale.y < 0 || child.scale.z < 0)) {
          const sx = child.scale.x;
          const sy = child.scale.y;
          const sz = child.scale.z;
          child.geometry = child.geometry.clone();
          child.geometry.scale(Math.sign(sx), Math.sign(sy), Math.sign(sz));
          child.scale.set(Math.abs(sx), Math.abs(sy), Math.abs(sz));
        }
      });

      // Scale to life-size for AR (Locust is ~4.5cm long; our 3D unit is scaled)
      // If 1 unit = 10mm, 0.1 scale = realistic life size; 0.5 scale = comfortable tabletop study size
      exportClone.scale.multiplyScalar(0.4);

      const arrayBuffer = await exporter.parse(exportClone, { quickLookCompatible: true });
      const blob = new Blob([arrayBuffer], { type: 'model/vnd.usdz+zip' });
      const blobUrl = URL.createObjectURL(blob);

      if (onProgress) onProgress('AR Quick Look を起動中...');

      const isAppleMobile = this.isIOSorIPad();
      const arAnchor = document.createElement('a');
      arAnchor.href = blobUrl;

      if (isAppleMobile) {
        // iOS / iPadOS Safari Quick Look trigger
        arAnchor.rel = 'ar';
        const thumbImg = document.createElement('img');
        thumbImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
        arAnchor.appendChild(thumbImg);
      } else {
        // Desktop / Other: Trigger USDZ file download
        arAnchor.download = filename;
      }

      document.body.appendChild(arAnchor);
      arAnchor.click();

      setTimeout(() => {
        if (arAnchor.parentNode) document.body.removeChild(arAnchor);
        if (onProgress) onProgress(isAppleMobile ? 'AR Quick Look 起動完了' : 'USDZファイルを書き出しました');
      }, 1500);

      return { success: true, url: blobUrl };
    } catch (err) {
      console.error('AR Export failed:', err);
      if (onProgress) onProgress(`ARエラー: ${err.message}`);
      alert(`AR起動エラー: ${err.message}\n※iPad Safariで開くと直接カメラARが起動します。`);
      return { success: false, error: err };
    }
  }
}
