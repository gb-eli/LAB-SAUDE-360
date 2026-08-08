import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class GLBAssetLoader {
  constructor({ events }) {
    this.events = events;
    this.loader = new GLTFLoader();
  }

  load(url, { onProgress } = {}) {
    return new Promise((resolve, reject) => {
      const resolvedUrl =
        globalThis.__LAB_STANDALONE_ASSET_URL__?.(
          url
        ) || url;

      this.events?.emit("asset3d:loading", { url });

      this.loader.load(
        resolvedUrl,
        (gltf) => {
          this.events?.emit("asset3d:loaded", { url });
          resolve(gltf);
        },
        (event) => {
          const total = event.total || 0;
          const progress = {
            url,
            loaded: event.loaded,
            total,
            ratio: total > 0 ? event.loaded / total : null
          };
          this.events?.emit("asset3d:progress", progress);
          onProgress?.(progress);
        },
        (error) => {
          this.events?.emit("asset3d:error", { url, error });
          reject(error);
        }
      );
    });
  }

  destroy() {
    this.loader = null;
    this.events = null;
  }
}
