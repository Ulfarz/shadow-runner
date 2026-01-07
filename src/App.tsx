import GameMap from './components/GameMap'
import { GameHUD } from './components/GameHUD'
import { useWakeLock } from './hooks/useWakeLock'
import { useGeolocation } from './hooks/useGeolocation'
import { useGameLogic } from './hooks/useGameLogic'
import { useFogOfWar } from './hooks/useFogOfWar'

function App() {
  useWakeLock();
  useGeolocation();
  useGameLogic();
  useFogOfWar();

  return (
    <main className="w-full h-screen relative">
      <GameMap />
      <GameHUD />
    </main>
  )
}

export default App