import { useEffect } from 'react'
import { authService } from './services/authService'
import GameMap from './components/GameMap'
import { GameHUD } from './components/GameHUD'
import { MainMenu } from './components/MainMenu'
import { EndGameScreen } from './components/EndGameScreen'
import { useWakeLock } from './hooks/useWakeLock'
import { useGeolocation } from './hooks/useGeolocation'
import { useGameLogic } from './hooks/useGameLogic'
import { useGameStore } from './store/useGameStore'
// i18n is initialized in main.tsx

function App() {
  const status = useGameStore((state) => state.status);
  const shadowDistance = useGameStore((state) => state.shadowDistance);

  // Initialize hooks
  useWakeLock();
  useGeolocation();
  useGameLogic();


  // Initialize Auth Service
  useEffect(() => {
    authService.initialize();
  }, []);

  // Calculate red screen opacity based on proximity to shadow
  // As shadowDistance approaches 0, opacity approaches 1.
  const MAX_DANGER_DIST = 100; // Start showing red at 100m
  let dangerOpacity = 0;

  if (status === 'ACTIVE' && shadowDistance !== null) {
    // Logic: Opacity = 1.0 when distance is near 0
    //        Opacity = 0.0 when distance >= MAX_DANGER_DIST
    const clampedDist = Math.max(0, Math.min(shadowDistance, MAX_DANGER_DIST));
    dangerOpacity = 1 - (clampedDist / MAX_DANGER_DIST);
  }

  return (
    <main className="w-full h-[100dvh] relative bg-slate-950 overflow-hidden">
      {/* Red Proximity Overlay */}
      <div
        className="fixed inset-0 bg-red-600 pointer-events-none z-[60] transition-opacity duration-300 ease-in-out"
        style={{ opacity: dangerOpacity }}
      />

      {status === 'IDLE' && <MainMenu />}
      <GameMap />
      <GameHUD />
      <EndGameScreen />
    </main>
  )
}

export default App
