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

      // Hide or remove non-geometry helpers (like guides or sprites) from USDZ export
      exportClone.traverse((child) => {
        if (child.name === 'measurement_guides' || child.isSprite || child.isLine) {
          child.visible = false;
        }
      });

      // Scale to life-size for AR (Locust is ~4.5cm long; our 3D unit is scaled)
      // If 1 unit = 10mm, 0.1 scale = realistic life size; 0.5 scale = comfortable tabletop study size
      exportClone.scale.multiplyScalar(0.4);

      const arrayBuffer = await exporter.parseAsync(exportClone);
      const blob = new Blob([arrayBuffer], { type: 'model/vnd.usdz+zip' });
      const blobUrl = URL.createObjectURL(blob);

      if (onProgress) onProgress('AR Quick Look を起動中...');

      // iOS Safari AR Quick Look trigger: anchor with rel="ar" and an <img> child
      const arAnchor = document.createElement('a');
      arAnchor.setAttribute('rel', 'ar');
      arAnchor.setAttribute('href', blobUrl);
      arAnchor.setAttribute('download', filename);

      const thumbImg = document.createElement('img');
      thumbImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
      arAnchor.appendChild(thumbImg);

      document.body.appendChild(arAnchor);
      arAnchor.click();

      setTimeout(() => {
        document.body.removeChild(arAnchor);
        if (onProgress) onProgress('AR準備完了');
      }, 2000);

      return { success: true, url: blobUrl };
    } catch (err) {
      console.error('AR Export failed:', err);
      if (onProgress) onProgress(`ARエラー: ${err.message}`);
      alert(`AR起動エラー: ${err.message}\n※iPad Safariで開くと直接カメラARが起動します。`);
      return { success: false, error: err };
    }
  }
}
