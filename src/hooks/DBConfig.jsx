export const DBConfig = {
    name: 'ShareVoid',
    version: 1,
    objectStoresMeta: [
      {
        store: 'localImages',
        storeConfig: { keyPath: 'id', autoIncrement: true },
        storeSchema: [
          { name: 'image', keypath: 'index', options: { unique: true } }
        ]
      }
    ]
  };