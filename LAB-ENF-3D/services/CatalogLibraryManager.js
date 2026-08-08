export class CatalogLibraryManager {
  constructor({
    storage,
    events,
    maxRecent = 8,
    maxRecentCollections = 6
  }) {
    this.storage = storage;
    this.events = events;
    this.maxRecent = maxRecent;
    this.maxRecentCollections = maxRecentCollections;

    this.favorites = new Set(
      storage.get("catalog:favorites", [])
    );

    this.recent =
      storage.get("catalog:recent", []);

    this.collectionFavorites = new Set(
      storage.get("catalog:collectionFavorites", [])
    );

    this.collectionRecent =
      storage.get("catalog:collectionRecent", []);
  }

  isFavorite(moduleId) {
    return this.favorites.has(moduleId);
  }

  toggleFavorite(moduleId) {
    if (this.favorites.has(moduleId)) {
      this.favorites.delete(moduleId);
    } else {
      this.favorites.add(moduleId);
    }

    const list = [...this.favorites];

    this.storage.set(
      "catalog:favorites",
      list
    );

    this.events?.emit(
      "catalog:favoritesChanged",
      { favorites:list }
    );

    return this.favorites.has(moduleId);
  }

  recordOpen(moduleId) {
    const now = new Date().toISOString();

    this.recent = [
      { moduleId, openedAt:now },
      ...this.recent.filter(
        item => item.moduleId !== moduleId
      )
    ].slice(0, this.maxRecent);

    this.storage.set(
      "catalog:recent",
      this.recent
    );

    this.events?.emit(
      "catalog:recentChanged",
      { recent:this.recent }
    );
  }

  getFavorites(modules = []) {
    const byId = new Map(
      modules.map(item => [item.id, item])
    );

    return [...this.favorites]
      .map(id => byId.get(id))
      .filter(Boolean);
  }

  getRecent(modules = []) {
    const byId = new Map(
      modules.map(item => [item.id, item])
    );

    return this.recent
      .map(item => ({
        ...item,
        module:byId.get(item.moduleId)
      }))
      .filter(item => item.module);
  }

  isCollectionFavorite(collectionId) {
    return this.collectionFavorites.has(
      collectionId
    );
  }

  toggleCollectionFavorite(collectionId) {
    if (
      this.collectionFavorites.has(
        collectionId
      )
    ) {
      this.collectionFavorites.delete(
        collectionId
      );
    } else {
      this.collectionFavorites.add(
        collectionId
      );
    }

    const list = [
      ...this.collectionFavorites
    ];

    this.storage.set(
      "catalog:collectionFavorites",
      list
    );

    this.events?.emit(
      "catalog:collectionFavoritesChanged",
      { favorites:list }
    );

    return this.collectionFavorites.has(
      collectionId
    );
  }

  recordCollectionOpen(collectionId) {
    const now = new Date().toISOString();

    this.collectionRecent = [
      {
        collectionId,
        openedAt:now
      },
      ...this.collectionRecent.filter(
        item =>
          item.collectionId !== collectionId
      )
    ].slice(0, this.maxRecentCollections);

    this.storage.set(
      "catalog:collectionRecent",
      this.collectionRecent
    );

    this.events?.emit(
      "catalog:collectionRecentChanged",
      { recent:this.collectionRecent }
    );
  }

  getFavoriteCollections(collections = []) {
    const byId = new Map(
      collections.map(item => [item.id, item])
    );

    return [...this.collectionFavorites]
      .map(id => byId.get(id))
      .filter(Boolean);
  }

  getRecentCollections(collections = []) {
    const byId = new Map(
      collections.map(item => [item.id, item])
    );

    return this.collectionRecent
      .map(item => ({
        ...item,
        collection:byId.get(
          item.collectionId
        )
      }))
      .filter(item => item.collection);
  }
}
