import GameMap from './components/GameMap'
import { GameHUD } from './components/GameHUD'
import { MainMenu } from './components/MainMenu'
import { EndGameScreen } from './components/EndGameScreen'
import { useWakeLock } from './hooks/useWakeLock'
import { useGeolocation } from './hooks/useGeolocation'
import { useGameLogic } from './hooks/useGameLogic'
import { useFogOfWar } from './hooks/useFogOfWar'
import { useGameStore } from './store/useGameStore'

function App() {
  const status = useGameStore((state) => state.status);

  useWakeLock();
  useGeolocation();
  useGameLogic();
  useFogOfWar();

  return (
    <main className="w-full h-screen relative bg-slate-950">
      {status === 'IDLE' && <MainMenu />}
      <GameMap />
      <GameHUD />
      <EndGameScreen />
    </main>
  )
}

export default App