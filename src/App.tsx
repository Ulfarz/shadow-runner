import { useEffect } from 'react'
import { authService } from './services/authService'
import GameMap from './components/GameMap'
import { GameHUD } from './components/GameHUD'
import { MainMenu } from './components/MainMenu'
import { EndGameScreen } from './components/EndGameScreen'
import { useWakeLock } from './hooks/useWakeLock'
import { useGeolocation } from './hooks/useGeolocation'
import { useGameLogic } from './hooks/useGameLogic'
import { useFogOfWar } from './hooks/useFogOfWar'
import { useGameStore } from './store/useGameStore'
// i18n is initialized in main.tsx

function App() {
  const status = useGameStore((state) => state.status);

  // Initialize hooks
  useWakeLock();
  useGeolocation();
  useGameLogic();
  useFogOfWar();

  // Initialize Auth Service
  useEffect(() => {
    authService.initialize();
  }, []);

  return (
    <main className="w-full h-[100dvh] relative bg-slate-950 overflow-hidden">
      {status === 'IDLE' && <MainMenu />}
      <GameMap />
      <GameHUD />
      <EndGameScreen />
    </main>
  )
}

export default App