import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import * as turf from '@turf/turf';
import { MAPBOX_TOKEN } from '../utils/config';

// Constants
const EXTRACTION_RADIUS_M = 50; // Win radius
const SHADOW_CATCH_RADIUS_M = 20; // Loss radius
const SHADOW_SPEED_KPH = 15; // Shadow speed in km/h

// Helper: Convert km/h to m/s
const kphToMps = (kph: number) => kph / 3.6;

export const useGameLogic = () => {
    const {
        userPosition,
        status,
        gameMode,
        extractionPoint,
        shadowPosition,
        targetDistance,
        setStatus,
        setExtractionPoint,
        setShadowPosition,
        setShadowDistance,
        setRouteCoordinates
    } = useGameStore();

    const lastUpdateRef = useRef<number>(Date.now());
    const requestRef = useRef<number>();

    // Start Game Logic
    useEffect(() => {
        if (status === 'ACTIVE' && userPosition && !shadowPosition) {
            const initGame = async () => {
                const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);

                // 1. Generate Extraction Point (Only for EXTRACTION mode)
                if (gameMode === 'EXTRACTION') {
                    const bearing = Math.random() * 360;
                    // Calculate rough destination based on target distance
                    const roughDest = turf.destination(userPoint, targetDistance, bearing);
                    const [roughLng, roughLat] = roughDest.geometry.coordinates;

                    try {
                        // Fetch real walking route
                        const response = await fetch(
                            `https://api.mapbox.com/directions/v5/mapbox/walking/${userPosition.longitude},${userPosition.latitude};${roughLng},${roughLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                        );
                        const data = await response.json();

                        if (data.routes && data.routes.length > 0) {
                            const route = data.routes[0];
                            const coords = route.geometry.coordinates;

                            // Only show route if NOT EXTRACTION mode (Extraction = Hard mode, no guide)
                            if (gameMode !== 'EXTRACTION') {
                                setRouteCoordinates(coords);
                            } else {
                                setRouteCoordinates(null); // Clear any existing route
                            }

                            // Set actual extraction point to the end of the route
                            const endPoint = coords[coords.length - 1];
                            setExtractionPoint({ latitude: endPoint[1], longitude: endPoint[0] });
                        } else {
                            console.warn("No route found, falling back to straight line");
                            setExtractionPoint({ latitude: roughLat, longitude: roughLng });
                            if (gameMode !== 'EXTRACTION') {
                                setRouteCoordinates([[userPosition.longitude, userPosition.latitude], [roughLng, roughLat]]);
                            } else {
                                setRouteCoordinates(null);
                            }
                        }
                    } catch (error) {
                        console.error("Routing error:", error);
                        setExtractionPoint({ latitude: roughLat, longitude: roughLng });
                        if (gameMode !== 'EXTRACTION') {
                            setRouteCoordinates([[userPosition.longitude, userPosition.latitude], [roughLng, roughLat]]);
                        } else {
                            setRouteCoordinates(null);
                        }
                    }

                    // Spawn Shadow behind user relative to the rough bearing
                    const shadowStart = turf.destination(userPoint, 0.5, (bearing + 180) % 360);
                    const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                    setShadowPosition({ latitude: shadowLat, longitude: shadowLng });

                } else {
                    // SURVIVAL: Spawn a visual target point at the chosen distance
                    const randomBearing = Math.random() * 360;
                    const roughDest = turf.destination(userPoint, targetDistance, randomBearing);
                    const [roughLng, roughLat] = roughDest.geometry.coordinates;

                    // Set visual target (reusing extractionPoint for rendering)
                    setExtractionPoint({ latitude: roughLat, longitude: roughLng });

                    // Simple straight line for visual reference
                    setRouteCoordinates([[userPosition.longitude, userPosition.latitude], [roughLng, roughLat]]);

                    // Spawn Shadow at random offset
                    const shadowBearing = Math.random() * 360;
                    const shadowStart = turf.destination(userPoint, 0.5, shadowBearing); // Start closer in survival? kept at 0.5km or adjust
                    const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                    setShadowPosition({ latitude: shadowLat, longitude: shadowLng });
                }
            };

            initGame();
        }
    }, [userPosition, status, gameMode, shadowPosition, targetDistance, setStatus, setExtractionPoint, setShadowPosition, setRouteCoordinates]);

    // Game Loop (Shadow Movement & Win/Loss Check)
    useEffect(() => {
        if (status !== 'ACTIVE' || !userPosition || !shadowPosition || !extractionPoint) {
            cancelAnimationFrame(requestRef.current!);
            return;
        }

        const loop = () => {
            const now = Date.now();
            const deltaTime = (now - lastUpdateRef.current) / 1000; // Seconds
            lastUpdateRef.current = now;

            // 1. Move Shadow
            const shadowPoint = turf.point([shadowPosition.longitude, shadowPosition.latitude]);
            const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);

            // Calculate bearing from Shadow to User
            const bearingToUser = turf.bearing(shadowPoint, userPoint);

            // Move shadow towards user
            const distanceToMoveKm = (kphToMps(SHADOW_SPEED_KPH) * deltaTime) / 1000;
            const newShadowPos = turf.destination(shadowPoint, distanceToMoveKm, bearingToUser);
            const [newShadowLng, newShadowLat] = newShadowPos.geometry.coordinates;

            setShadowPosition({ latitude: newShadowLat, longitude: newShadowLng });

            // 2. Check Win Condition (Only in EXTRACTION Mode)
            if (gameMode === 'EXTRACTION' && extractionPoint) {
                const extractionGeo = turf.point([extractionPoint.longitude, extractionPoint.latitude]);
                const distToExtraction = turf.distance(userPoint, extractionGeo, { units: 'meters' });
                if (distToExtraction < EXTRACTION_RADIUS_M) {
                    setStatus('EXTRACTED');
                    return;
                }
            }

            // 3. Check Loss Condition (Distance to Shadow)
            const distToShadow = turf.distance(userPoint, shadowPoint, { units: 'meters' });
            setShadowDistance(distToShadow); // Update distance for UI/FX

            if (distToShadow < SHADOW_CATCH_RADIUS_M) {
                setStatus('CAUGHT');
                return; // Loop ends
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [status, userPosition, shadowPosition, extractionPoint, setStatus, setShadowPosition, setShadowDistance]);
};


