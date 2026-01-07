import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import * as turf from '@turf/turf';

// Constants
const EXTRACTION_DISTANCE_KM = 2.0; // Target distance
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
        setStatus,
        setExtractionPoint,
        setShadowPosition,
        setShadowDistance
    } = useGameStore();

    const lastUpdateRef = useRef<number>(Date.now());
    const requestRef = useRef<number>();

    // Start Game Logic
    useEffect(() => {
        if (status === 'ACTIVE' && userPosition && !shadowPosition) {
            const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);

            // 1. Generate Extraction Point (Only for EXTRACTION mode)
            if (gameMode === 'EXTRACTION') {
                const bearing = Math.random() * 360;
                const destination = turf.destination(userPoint, EXTRACTION_DISTANCE_KM, bearing);
                const [destLng, destLat] = destination.geometry.coordinates;
                setExtractionPoint({ latitude: destLat, longitude: destLng });

                // Spawn Shadow behind user relative to extraction
                const shadowStart = turf.destination(userPoint, 0.5, (bearing + 180) % 360);
                const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                setShadowPosition({ latitude: shadowLat, longitude: shadowLng });
            } else {
                // SURVIVAL: No extraction point, spawn shadow at random distance/offset
                const randomBearing = Math.random() * 360;
                const shadowStart = turf.destination(userPoint, 0.8, randomBearing);
                const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                setShadowPosition({ latitude: shadowLat, longitude: shadowLng });
                setExtractionPoint(null); // Clear just in case
            }
        }
    }, [userPosition, status, gameMode, shadowPosition, setStatus, setExtractionPoint, setShadowPosition]);

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


