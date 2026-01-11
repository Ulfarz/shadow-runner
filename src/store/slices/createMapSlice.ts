import { StateCreator } from 'zustand';
import { GameState, MapSlice } from '../types';

export const createMapSlice: StateCreator<GameState, [], [], MapSlice> = (set) => ({
    extractionPoint: null,
    routeCoordinates: null,
    exploredPolygon: null,
    distanceToExtraction: null,
    initialDistanceToExtraction: null,
    centerOnPlayer: null,
    setExtractionPoint: (point) => set({ extractionPoint: point }),
    setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
    setExploredPolygon: (polygon) => set({ exploredPolygon: polygon }),
    setDistanceToExtraction: (distance) => set({ distanceToExtraction: distance }),
    setInitialDistanceToExtraction: (distance) => set({ initialDistanceToExtraction: distance }),
    setCenterOnPlayer: (callback) => set({ centerOnPlayer: callback }),
    resetMap: () => set({
        extractionPoint: null,
        routeCoordinates: null,
        exploredPolygon: null,
        distanceToExtraction: null,
        initialDistanceToExtraction: null,
    }),
});
