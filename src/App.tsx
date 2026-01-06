import GameMap from './components/GameMap'
import { useWakeLock } from './hooks/useWakeLock'

function App() {
  useWakeLock();
  
  return (
    <main className="w-full h-screen">
      <GameMap />
    </main>
  )
}

export default App