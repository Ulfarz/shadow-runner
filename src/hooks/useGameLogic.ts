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
        if (status === 'IDLE' && userPosition && !extractionPoint) {
            // 1. Generate Extraction Point
            const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);

            // Random bearing (0-360)
            const bearing = Math.random() * 360;

            // Calculate destination point
            const destination = turf.destination(userPoint, EXTRACTION_DISTANCE_KM, bearing);
            const [destLng, destLat] = destination.geometry.coordinates;

            setExtractionPoint({ latitude: destLat, longitude: destLng });

            // 2. Spawn Shadow (initially 500m behind user or random offset)
            // For now, let's spawn it 500m "behind" relative to extraction (simplified: opposite bearing)
            const shadowStart = turf.destination(userPoint, 0.5, (bearing + 180) % 360);
            const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;

            setShadowPosition({ latitude: shadowLat, longitude: shadowLng });

            setStatus('ACTIVE');
        }
    }, [userPosition, status, extractionPoint, setStatus, setExtractionPoint, setShadowPosition, setShadowDistance]);

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
            const extractionGeo = turf.point([extractionPoint.longitude, extractionPoint.latitude]);

            // Calculate bearing from Shadow to User
            const bearingToUser = turf.bearing(shadowPoint, userPoint);

            // Move shadow towards user
            const distanceToMoveKm = (kphToMps(SHADOW_SPEED_KPH) * deltaTime) / 1000;
            const newShadowPos = turf.destination(shadowPoint, distanceToMoveKm, bearingToUser);
            const [newShadowLng, newShadowLat] = newShadowPos.geometry.coordinates;

            setShadowPosition({ latitude: newShadowLat, longitude: newShadowLng });

            // 2. Check Win Condition (Distance to Extraction)
            const distToExtraction = turf.distance(userPoint, extractionGeo, { units: 'meters' });
            if (distToExtraction < EXTRACTION_RADIUS_M) {
                setStatus('EXTRACTED');
                return; // Loop ends
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


