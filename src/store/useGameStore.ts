import { create } from 'zustand';
import { Feature, Polygon, MultiPolygon } from 'geojson';

export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
}

export type GameStatus = 'IDLE' | 'ACTIVE' | 'EXTRACTED' | 'CAUGHT';

export interface GameState {
  userPosition: UserPosition | null;
  setUserPosition: (position: UserPosition) => void;

  // Survival State
  status: GameStatus;
  extractionPoint: { latitude: number; longitude: number } | null;
  shadowPosition: { latitude: number; longitude: number } | null;
  shadowDistance: number | null; // Distance in meters

  // Fog of War State
  exploredPolygon: Feature<Polygon | MultiPolygon> | null;
  setExploredPolygon: (polygon: Feature<Polygon | MultiPolygon> | null) => void;

  setStatus: (status: GameStatus) => void;
  setExtractionPoint: (point: { latitude: number; longitude: number } | null) => void;
  setShadowPosition: (point: { latitude: number; longitude: number } | null) => void;
  setShadowDistance: (distance: number | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  userPosition: null,
  setUserPosition: (position) => set({ userPosition: position }),

  status: 'IDLE',
  extractionPoint: null,
  shadowPosition: null,
  shadowDistance: null,
  exploredPolygon: null,

  setStatus: (status) => set({ status }),
  setExtractionPoint: (point) => set({ extractionPoint: point }),
  setShadowPosition: (point) => set({ shadowPosition: point }),
  setShadowDistance: (distance) => set({ shadowDistance: distance }),
  setExploredPolygon: (polygon) => set({ exploredPolygon: polygon }),
  resetGame: () => set({
    status: 'IDLE',
    extractionPoint: null,
    shadowPosition: null,
    shadowDistance: null,
    exploredPolygon: null
  }),
}));
