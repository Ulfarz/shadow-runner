import { openDB, DBSchema } from 'idb';
import { Feature, Polygon, MultiPolygon } from 'geojson';

interface ShadowRunnerDB extends DBSchema {
  'game-state': {
    key: string;
    value: Feature<Polygon | MultiPolygon> | null;
  };
}

const DB_NAME = 'shadow-runner-db';
const STORE_NAME = 'game-state';

export const initDB = async () => {
  return openDB<ShadowRunnerDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
};

export const saveExploredPolygon = async (polygon: Feature<Polygon | MultiPolygon>) => {
  const db = await initDB();
  await db.put(STORE_NAME, polygon, 'explored-polygon');
};

export const getExploredPolygon = async (): Promise<Feature<Polygon | MultiPolygon> | undefined> => {
  const db = await initDB();
  return (await db.get(STORE_NAME, 'explored-polygon')) || undefined;
};
