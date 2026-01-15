import { useEffect, useRef } from 'react';
import { useGameStore, BonusMission } from '../store/useGameStore';
import * as turf from '@turf/turf';
import { MAPBOX_TOKEN } from '../utils/config';
import {
    EXTRACTION_RADIUS_M,
    SHADOW_CATCH_RADIUS_M,
    CHECKPOINT_RADIUS_M,
    kphToMps,
    calculateRank
} from '../utils/gameRules';

export const useGameLogic = () => {
    const {
        userPosition,
        status,
        gameMode,
        extractionPoint,
        shadowPosition,
        targetDistance,
        checkpoint,
        checkpointReached,
        bonusMissions,
        gameStartTime,
        currentShadowSpeed,
        baseShadowSpeed,
        maxShadowSpeed,
        initialDistanceToExtraction,
        setStatus,
        setExtractionPoint,
        setShadowPosition,
        setShadowDistance,
        setRouteCoordinates,
        setGameStartTime,
        setGameEndTime,
        setCurrentShadowSpeed,
        setDistanceToExtraction,
        setInitialDistanceToExtraction,
        setBonusMissions,
        updateBonusMission,
        setFinalRank,
        setCheckpoint,
        setCheckpointReached,
        addToPathHistory
    } = useGameStore();

    const lastUpdateRef = useRef<number>(Date.now());
    const requestRef = useRef<number>();
    const speedChallengeRef = useRef<number>(0); // Track speed challenge progress

    // Start Game Logic
    useEffect(() => {
        if (status === 'ACTIVE' && userPosition && !shadowPosition) {
            const initGame = async () => {
                const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);

                // Start timer
                setGameStartTime(Date.now());

                // 1. Generate Extraction Point (Only for EXTRACTION mode)
                if (gameMode === 'EXTRACTION') {
                    const bearing = Math.random() * 360;
                    const roughDest = turf.destination(userPoint, targetDistance, bearing);
                    const [roughLng, roughLat] = roughDest.geometry.coordinates;

                    try {
                        const response = await fetch(
                            `https://api.mapbox.com/directions/v5/mapbox/walking/${userPosition.longitude},${userPosition.latitude};${roughLng},${roughLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                        );
                        const data = await response.json();

                        if (data.routes && data.routes.length > 0) {
                            const route = data.routes[0];
                            const coords = route.geometry.coordinates;

                            // No route display in Extraction mode
                            setRouteCoordinates(null);

                            // Set extraction point
                            const endPoint = coords[coords.length - 1];
                            setExtractionPoint({ latitude: endPoint[1], longitude: endPoint[0] });

                            // Calculate initial distance
                            const extractionGeo = turf.point(endPoint);
                            const initDist = turf.distance(userPoint, extractionGeo, { units: 'meters' });
                            setInitialDistanceToExtraction(initDist);
                            setDistanceToExtraction(initDist);

                            // Generate checkpoint at ~50% of route
                            const midIndex = Math.floor(coords.length / 2);
                            const midPoint = coords[midIndex];
                            setCheckpoint({ latitude: midPoint[1], longitude: midPoint[0] });

                            // Generate bonus missions
                            const missions: BonusMission[] = [
                                {
                                    id: 'checkpoint',
                                    type: 'CHECKPOINT',
                                    description: 'Pass through the checkpoint',
                                    completed: false,
                                    position: { latitude: midPoint[1], longitude: midPoint[0] }
                                },
                                {
                                    id: 'time_bonus',
                                    type: 'TIME_BONUS',
                                    description: `Finish in under ${Math.round(targetDistance * 6)} min`,
                                    completed: false,
                                    targetTime: targetDistance * 6 * 60 // S rank time
                                },
                                {
                                    id: 'speed_challenge',
                                    type: 'SPEED_CHALLENGE',
                                    description: 'Maintain 8+ km/h for 30s',
                                    completed: false,
                                    minSpeed: 8,
                                    duration: 30,
                                    progress: 0
                                }
                            ];
                            setBonusMissions(missions);

                        } else {
                            console.warn("No route found, falling back to straight line");
                            setExtractionPoint({ latitude: roughLat, longitude: roughLng });
                            setRouteCoordinates(null);

                            const initDist = targetDistance * 1000;
                            setInitialDistanceToExtraction(initDist);
                            setDistanceToExtraction(initDist);
                        }
                    } catch (error) {
                        console.error("Routing error:", error);
                        setExtractionPoint({ latitude: roughLat, longitude: roughLng });
                        setRouteCoordinates(null);
                    }

                    // Spawn Shadow behind user
                    const shadowStart = turf.destination(userPoint, 0.5, (bearing + 180) % 360);
                    const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                    setShadowPosition({ latitude: shadowLat, longitude: shadowLng });

                } else {
                    // SURVIVAL mode - unchanged
                    const randomBearing = Math.random() * 360;
                    const roughDest = turf.destination(userPoint, targetDistance, randomBearing);
                    const [roughLng, roughLat] = roughDest.geometry.coordinates;

                    setExtractionPoint({ latitude: roughLat, longitude: roughLng });
                    setRouteCoordinates([[userPosition.longitude, userPosition.latitude], [roughLng, roughLat]]);

                    const shadowBearing = Math.random() * 360;
                    const shadowStart = turf.destination(userPoint, 0.5, shadowBearing);
                    const [shadowLng, shadowLat] = shadowStart.geometry.coordinates;
                    setShadowPosition({ latitude: shadowLat, longitude: shadowLng });
                }
            };

            initGame();
        }
    }, [userPosition, status, gameMode, shadowPosition, targetDistance]);

    // Track Path History
    useEffect(() => {
        if (status === 'ACTIVE' && userPosition) {
            addToPathHistory([userPosition.longitude, userPosition.latitude]);
        }
    }, [userPosition, status, addToPathHistory]);

    // Game Loop (Shadow Movement & Win/Loss Check)
    useEffect(() => {
        if (status !== 'ACTIVE' || !userPosition || !shadowPosition || !extractionPoint) {
            cancelAnimationFrame(requestRef.current!);
            return;
        }

        const loop = () => {
            const now = Date.now();
            const deltaTime = (now - lastUpdateRef.current) / 1000;
            lastUpdateRef.current = now;

            const shadowPoint = turf.point([shadowPosition.longitude, shadowPosition.latitude]);
            const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);
            const extractionGeo = turf.point([extractionPoint.longitude, extractionPoint.latitude]);

            // Calculate distance to extraction
            const distToExtraction = turf.distance(userPoint, extractionGeo, { units: 'meters' });
            setDistanceToExtraction(distToExtraction);

            // Dynamic Shadow Speed (Extraction mode only)
            let shadowSpeed = currentShadowSpeed;
            if (gameMode === 'EXTRACTION' && initialDistanceToExtraction) {
                // Increase speed based on progress (distance covered)
                const progress = 1 - (distToExtraction / initialDistanceToExtraction);
                const speedIncrease = (maxShadowSpeed - baseShadowSpeed) * progress;
                shadowSpeed = Math.min(baseShadowSpeed + speedIncrease, maxShadowSpeed);
                setCurrentShadowSpeed(shadowSpeed);
            }

            // Move Shadow towards user
            const bearingToUser = turf.bearing(shadowPoint, userPoint);
            const distanceToMoveKm = (kphToMps(shadowSpeed) * deltaTime) / 1000;
            const newShadowPos = turf.destination(shadowPoint, distanceToMoveKm, bearingToUser);
            const [newShadowLng, newShadowLat] = newShadowPos.geometry.coordinates;
            setShadowPosition({ latitude: newShadowLat, longitude: newShadowLng });

            // Check Checkpoint (Extraction mode)
            if (gameMode === 'EXTRACTION' && checkpoint && !checkpointReached) {
                const checkpointGeo = turf.point([checkpoint.longitude, checkpoint.latitude]);
                const distToCheckpoint = turf.distance(userPoint, checkpointGeo, { units: 'meters' });
                if (distToCheckpoint < CHECKPOINT_RADIUS_M) {
                    setCheckpointReached(true);
                    updateBonusMission('checkpoint', { completed: true });
                }
            }

            // Check Speed Challenge (Extraction mode)
            if (gameMode === 'EXTRACTION') {
                const playerSpeedKph = (userPosition.speed || 0) * 3.6;
                const speedMission = bonusMissions.find(m => m.id === 'speed_challenge');
                if (speedMission && !speedMission.completed) {
                    if (playerSpeedKph >= (speedMission.minSpeed || 8)) {
                        speedChallengeRef.current += deltaTime;
                        updateBonusMission('speed_challenge', { progress: speedChallengeRef.current });
                        if (speedChallengeRef.current >= (speedMission.duration || 30)) {
                            updateBonusMission('speed_challenge', { completed: true });
                        }
                    } else {
                        speedChallengeRef.current = 0;
                        updateBonusMission('speed_challenge', { progress: 0 });
                    }
                }
            }

            // Check Win Condition (Extraction Mode)
            if (gameMode === 'EXTRACTION') {
                if (distToExtraction < EXTRACTION_RADIUS_M) {
                    const endTime = Date.now();
                    setGameEndTime(endTime);

                    const timeSeconds = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
                    const timeMission = bonusMissions.find(m => m.id === 'time_bonus');
                    if (timeMission && timeSeconds <= (timeMission.targetTime || Infinity)) {
                        updateBonusMission('time_bonus', { completed: true });
                    }

                    const completedCount = bonusMissions.filter(m => m.completed).length +
                        (timeMission && timeSeconds <= (timeMission.targetTime || Infinity) ? 1 : 0);

                    const rank = calculateRank(timeSeconds, targetDistance, completedCount, bonusMissions.length, false);
                    setFinalRank(rank);
                    setStatus('VICTORY');
                    return;
                }
            }

            // Check Loss Condition
            const distToShadow = turf.distance(userPoint, shadowPoint, { units: 'meters' });
            setShadowDistance(distToShadow);

            if (distToShadow < SHADOW_CATCH_RADIUS_M) {
                setGameEndTime(Date.now());
                setFinalRank('F');
                setStatus('GAME_OVER');
                return;
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [status, userPosition, shadowPosition, extractionPoint, gameMode, checkpoint, checkpointReached, bonusMissions, gameStartTime, currentShadowSpeed, initialDistanceToExtraction]);
};
