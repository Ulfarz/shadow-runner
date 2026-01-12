import { render } from '@testing-library/react';
import { GameHUD } from './GameHUD';
import { useGameStore } from '../store/useGameStore';
import { describe, it, beforeEach, vi } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('GameHUD', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ userPosition: null, status: 'ACTIVE' });
  });

  it('renders without crashing', () => {
    render(<GameHUD />);
  });
});
