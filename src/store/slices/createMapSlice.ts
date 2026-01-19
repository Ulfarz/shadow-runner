import { StateCreator } from 'zustand';
import { GameState, MapSlice } from '../types';

export const createMapSlice: StateCreator<GameState, [], [], MapSlice> = (set) => ({
    extractionPoint: null,
    routeCoordinates: null,

    distanceToExtraction: null,
    initialDistanceToExtraction: null,
    centerOnPlayer: null,
    centerOnExtraction: null,
    setExtractionPoint: (point) => set({ extractionPoint: point }),
    setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
    setDistanceToExtraction: (distance) => set({ distanceToExtraction: distance }),
    setInitialDistanceToExtraction: (distance) => set({ initialDistanceToExtraction: distance }),
    setCenterOnPlayer: (callback) => set({ centerOnPlayer: callback }),
    setCenterOnExtraction: (callback) => set({ centerOnExtraction: callback }),
    resetMap: () => set({
        extractionPoint: null,
        routeCoordinates: null,
        distanceToExtraction: null,
        initialDistanceToExtraction: null,
        centerOnPlayer: null,
        centerOnExtraction: null,
    }),
});
