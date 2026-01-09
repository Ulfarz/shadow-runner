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
export type MissionRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface BonusMission {
  id: string;
  type: 'CHECKPOINT' | 'TIME_BONUS' | 'SPEED_CHALLENGE';
  description: string;
  completed: boolean;
  // For checkpoint
  position?: { latitude: number; longitude: number };
  // For time bonus
  targetTime?: number; // seconds
  // For speed challenge
  minSpeed?: number; // km/h
  duration?: number; // seconds to maintain
  progress?: number; // current progress in seconds
}

export interface GameState {
  userPosition: UserPosition | null;
  setUserPosition: (position: UserPosition) => void;

  // Core Game State
  status: GameStatus;
  gameMode: GameMode | null;
  extractionPoint: { latitude: number; longitude: number } | null;
  shadowPosition: { latitude: number; longitude: number } | null;
  shadowDistance: number | null;
  targetDistance: number;
  routeCoordinates: number[][] | null;

  // Fog of War State
  exploredPolygon: Feature<Polygon | MultiPolygon> | null;
  setExploredPolygon: (polygon: Feature<Polygon | MultiPolygon> | null) => void;

  // Gamification State (Extraction Mode)
  gameStartTime: number | null;
  gameEndTime: number | null;
  currentShadowSpeed: number; // km/h
  baseShadowSpeed: number; // km/h (starting speed)
  maxShadowSpeed: number; // km/h (cap)
  distanceToExtraction: number | null; // meters
  initialDistanceToExtraction: number | null; // meters (for progress calc)
  bonusMissions: BonusMission[];
  completedBonusCount: number;
  finalRank: MissionRank | null;
  checkpoint: { latitude: number; longitude: number } | null;
  checkpointReached: boolean;

  // Setters
  setStatus: (status: GameStatus) => void;
  setGameMode: (mode: GameMode | null) => void;
  setExtractionPoint: (point: { latitude: number; longitude: number } | null) => void;
  setShadowPosition: (point: { latitude: number; longitude: number } | null) => void;
  setShadowDistance: (distance: number | null) => void;
  setTargetDistance: (distance: number) => void;
  setRouteCoordinates: (coords: number[][] | null) => void;

  // Gamification Setters
  setGameStartTime: (time: number | null) => void;
  setGameEndTime: (time: number | null) => void;
  setCurrentShadowSpeed: (speed: number) => void;
  setDistanceToExtraction: (distance: number | null) => void;
  setInitialDistanceToExtraction: (distance: number | null) => void;
  setBonusMissions: (missions: BonusMission[]) => void;
  updateBonusMission: (id: string, updates: Partial<BonusMission>) => void;
  setFinalRank: (rank: MissionRank | null) => void;
  setCheckpoint: (point: { latitude: number; longitude: number } | null) => void;
  setCheckpointReached: (reached: boolean) => void;

  // Map control callback
  centerOnPlayer: (() => void) | null;
  setCenterOnPlayer: (callback: (() => void) | null) => void;

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
  targetDistance: 2.0,
  routeCoordinates: null,
  exploredPolygon: null,

  // Gamification defaults
  gameStartTime: null,
  gameEndTime: null,
  currentShadowSpeed: 15,
  baseShadowSpeed: 15,
  maxShadowSpeed: 25,
  distanceToExtraction: null,
  initialDistanceToExtraction: null,
  bonusMissions: [],
  completedBonusCount: 0,
  finalRank: null,
  checkpoint: null,
  checkpointReached: false,

  setStatus: (status) => set({ status }),
  setGameMode: (gameMode) => set({ gameMode }),
  setExtractionPoint: (point) => set({ extractionPoint: point }),
  setShadowPosition: (point) => set({ shadowPosition: point }),
  setShadowDistance: (distance) => set({ shadowDistance: distance }),
  setTargetDistance: (distance) => set({ targetDistance: distance }),
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  setExploredPolygon: (polygon) => set({ exploredPolygon: polygon }),

  // Gamification setters
  setGameStartTime: (time) => set({ gameStartTime: time }),
  setGameEndTime: (time) => set({ gameEndTime: time }),
  setCurrentShadowSpeed: (speed) => set({ currentShadowSpeed: speed }),
  setDistanceToExtraction: (distance) => set({ distanceToExtraction: distance }),
  setInitialDistanceToExtraction: (distance) => set({ initialDistanceToExtraction: distance }),
  setBonusMissions: (missions) => set({ bonusMissions: missions }),
  updateBonusMission: (id, updates) => set((state) => ({
    bonusMissions: state.bonusMissions.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
    completedBonusCount: state.bonusMissions.filter((m) =>
      m.id === id ? updates.completed ?? m.completed : m.completed
    ).length
  })),
  setFinalRank: (rank) => set({ finalRank: rank }),
  setCheckpoint: (point) => set({ checkpoint: point }),
  setCheckpointReached: (reached) => set({ checkpointReached: reached }),

  // Map control
  centerOnPlayer: null,
  setCenterOnPlayer: (callback) => set({ centerOnPlayer: callback }),

  resetGame: () => set({
    status: 'IDLE',
    gameMode: null,
    extractionPoint: null,
    shadowPosition: null,
    shadowDistance: null,
    targetDistance: 2.0,
    routeCoordinates: null,
    exploredPolygon: null,
    // Reset gamification
    gameStartTime: null,
    gameEndTime: null,
    currentShadowSpeed: 15,
    distanceToExtraction: null,
    initialDistanceToExtraction: null,
    bonusMissions: [],
    completedBonusCount: 0,
    finalRank: null,
    checkpoint: null,
    checkpointReached: false
  }),
}));
