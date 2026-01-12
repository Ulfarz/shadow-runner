import GameMap from './components/GameMap'
import { GameHUD } from './components/GameHUD'
import { MainMenu } from './components/MainMenu'
import { EndGameScreen } from './components/EndGameScreen'
import { useWakeLock } from './hooks/useWakeLock'
import { useGeolocation } from './hooks/useGeolocation'
import { useGameLogic } from './hooks/useGameLogic'
import { useFogOfWar } from './hooks/useFogOfWar'
import { useGameStore } from './store/useGameStore'
import { useTranslation } from 'react-i18next';

const HomeScreen = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col items-center">
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>

      {/* Sélecteur de langue rapide en haut */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => i18n.changeLanguage('fr')}
          className={`text-xs ${i18n.language === 'fr' ? 'text-red-500' : 'text-white'}`}
        >FR</button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          className={`text-xs ${i18n.language === 'en' ? 'text-red-500' : 'text-white'}`}
        >EN</button>
      </div>

      <div className="buttons-container">
        <button>{t('home.btn_extraction')}</button>
        <button>{t('home.btn_survival')}</button>
      </div>

      <div className="mode-select">
        <label>{t('home.mode_select')}</label>
        <button>{t('home.walk')}</button>
        <button>{t('home.run')}</button>
      </div>

      <button className="bg-blue-600">
        {t('auth.login_google')}
      </button>
    </div>
  );
};