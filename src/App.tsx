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
import { MAX_DANGER_DIST } from './utils/gameRules'
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

      {/* Map - Rendered first (bottom layer) */}
      {/* Hide when IDLE to ensure black fog doesn't cover main menu on some devices */}
      <div className={`absolute inset-0 z-0 ${status === 'IDLE' ? 'invisible pointer-events-none' : 'visible'}`}>
        <GameMap />
      </div>



      <GameHUD />
      <EndGameScreen />

      {/* Menus on top - Rendered last in DOM for natural stacking + Z-index */}
      {status === 'IDLE' && <MainMenu />}
    </main>
  )
}

export default App
