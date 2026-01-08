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
export type GameMode = 'EXTRACTION' | 'SURVIVAL';

export interface GameState {
  userPosition: UserPosition | null;
  setUserPosition: (position: UserPosition) => void;

  // Survival State
  status: GameStatus;
  gameMode: GameMode | null;
  extractionPoint: { latitude: number; longitude: number } | null;
  shadowPosition: { latitude: number; longitude: number } | null;
  shadowDistance: number | null; // Distance in meters
  targetDistance: number; // Target distance in km
  routeCoordinates: number[][] | null; // Array of [lng, lat]

  // Fog of War State
  exploredPolygon: Feature<Polygon | MultiPolygon> | null;
  setExploredPolygon: (polygon: Feature<Polygon | MultiPolygon> | null) => void;

  setStatus: (status: GameStatus) => void;
  setGameMode: (mode: GameMode | null) => void;
  setExtractionPoint: (point: { latitude: number; longitude: number } | null) => void;
  setShadowPosition: (point: { latitude: number; longitude: number } | null) => void;
  setShadowDistance: (distance: number | null) => void;
  setTargetDistance: (distance: number) => void;
  setRouteCoordinates: (coords: number[][] | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  userPosition: null,
  setUserPosition: (position) => set({ userPosition: position }),

  status: 'IDLE',
  gameMode: null,
  extractionPoint: null,
  shadowPosition: null,
  shadowDistance: null,
  targetDistance: 2.0, // Default 2km
  routeCoordinates: null,
  exploredPolygon: null,

  setStatus: (status) => set({ status }),
  setGameMode: (gameMode) => set({ gameMode }),
  setExtractionPoint: (point) => set({ extractionPoint: point }),
  setShadowPosition: (point) => set({ shadowPosition: point }),
  setShadowDistance: (distance) => set({ shadowDistance: distance }),
  setTargetDistance: (distance) => set({ targetDistance: distance }),
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  setExploredPolygon: (polygon) => set({ exploredPolygon: polygon }),
  resetGame: () => set({
    status: 'IDLE',
    gameMode: null,
    extractionPoint: null,
    shadowPosition: null,
    shadowDistance: null,
    targetDistance: 2.0,
    routeCoordinates: null,
    exploredPolygon: null
  }),
}));
