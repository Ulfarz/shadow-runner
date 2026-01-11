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
    position?: { latitude: number; longitude: number };
    targetTime?: number;
    minSpeed?: number;
    duration?: number;
    progress?: number;
}

// Slice Interfaces
export interface PlayerSlice {
    userPosition: UserPosition | null;
    pathHistory: number[][];
    gpsError: string | null;
    setUserPosition: (position: UserPosition) => void;
    setGpsError: (error: string | null) => void;
    addToPathHistory: (point: number[]) => void;
    resetPlayer: () => void;
}

export interface GameSlice {
    status: GameStatus;
    gameMode: GameMode | null;
    gameStartTime: number | null;
    gameEndTime: number | null;
    targetDistance: number;
    finalRank: MissionRank | null;
    setStatus: (status: GameStatus) => void;
    setGameMode: (mode: GameMode | null) => void;
    setGameStartTime: (time: number | null) => void;
    setGameEndTime: (time: number | null) => void;
    setTargetDistance: (distance: number) => void;
    setFinalRank: (rank: MissionRank | null) => void;
    resetGameSlice: () => void;
}

export interface MapSlice {
    extractionPoint: { latitude: number; longitude: number } | null;
    routeCoordinates: number[][] | null;
    exploredPolygon: Feature<Polygon | MultiPolygon> | null;
    distanceToExtraction: number | null;
    initialDistanceToExtraction: number | null;
    centerOnPlayer: (() => void) | null;
    setExtractionPoint: (point: { latitude: number; longitude: number } | null) => void;
    setRouteCoordinates: (coords: number[][] | null) => void;
    setExploredPolygon: (polygon: Feature<Polygon | MultiPolygon> | null) => void;
    setDistanceToExtraction: (distance: number | null) => void;
    setInitialDistanceToExtraction: (distance: number | null) => void;
    setCenterOnPlayer: (callback: (() => void) | null) => void;
    resetMap: () => void;
}

export interface ShadowSlice {
    shadowPosition: { latitude: number; longitude: number } | null;
    shadowDistance: number | null;
    currentShadowSpeed: number;
    baseShadowSpeed: number;
    maxShadowSpeed: number;
    setShadowPosition: (point: { latitude: number; longitude: number } | null) => void;
    setShadowDistance: (distance: number | null) => void;
    setCurrentShadowSpeed: (speed: number) => void;
    resetShadow: () => void;
}

export interface MissionSlice {
    bonusMissions: BonusMission[];
    completedBonusCount: number;
    checkpoint: { latitude: number; longitude: number } | null;
    checkpointReached: boolean;
    setBonusMissions: (missions: BonusMission[]) => void;
    updateBonusMission: (id: string, updates: Partial<BonusMission>) => void;
    setCheckpoint: (point: { latitude: number; longitude: number } | null) => void;
    setCheckpointReached: (reached: boolean) => void;
    resetMissions: () => void;
}

export type GameState = PlayerSlice & GameSlice & MapSlice & ShadowSlice & MissionSlice & {
    resetGame: () => void;
};
