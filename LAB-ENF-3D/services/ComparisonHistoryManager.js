export class ComparisonHistoryManager {
  constructor({
    dbName = "lab-enfermagem-comparison-history",
    storeName = "captures",
    maxItems = 8
  } = {}) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.maxItems = maxItems;
    this.dbPromise = null;
  }

  supported() {
    return typeof indexedDB !== "undefined";
  }

  open() {
    if (!this.supported()) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(
            this.storeName,
            { keyPath: "id" }
          );

          store.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
          );
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async save({ blob, metadata = {} }) {
    const db = await this.open();
    if (!db || !blob) return null;

    const item = {
      id:
        globalThis.crypto?.randomUUID?.() ||
        `cmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      blob,
      metadata
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(
        this.storeName,
        "readwrite"
      );

      tx.objectStore(this.storeName).put(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    await this.trim();
    return item;
  }

  async list() {
    const db = await this.open();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        this.storeName,
        "readonly"
      );

      const request = tx
        .objectStore(this.storeName)
        .getAll();

      request.onsuccess = () => {
        resolve(
          request.result
            .sort((a, b) =>
              String(b.createdAt).localeCompare(
                String(a.createdAt)
              )
            )
            .slice(0, this.maxItems)
        );
      };

      request.onerror = () => reject(request.error);
    });
  }

  async remove(id) {
    const db = await this.open();
    if (!db) return;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(
        this.storeName,
        "readwrite"
      );

      tx.objectStore(this.storeName).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear() {
    const db = await this.open();
    if (!db) return;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(
        this.storeName,
        "readwrite"
      );

      tx.objectStore(this.storeName).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async trim() {
    const db = await this.open();
    if (!db) return;

    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction(
        this.storeName,
        "readonly"
      );

      const request = tx
        .objectStore(this.storeName)
        .getAll();

      request.onsuccess = () => resolve(
        request.result.sort((a, b) =>
          String(b.createdAt).localeCompare(
            String(a.createdAt)
          )
        )
      );

      request.onerror = () => reject(request.error);
    });

    for (const item of items.slice(this.maxItems)) {
      await this.remove(item.id);
    }
  }

  async download(item) {
    if (!item?.blob) return;

    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
      item.metadata?.filename ||
      `comparacao-anatomica-${item.id}.png`;

    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1200);
  }
}
