import { BrowserRouter } from 'react-router-dom';
import { GameProvider, useGameState, useGameDispatch } from './contexts/GameContext';
import { GameHomePage } from './pages/GameHomePage';
import { GameChatPage } from './pages/GameChatPage';
import { LoveStoryPage } from './pages/LoveStoryPage';
import { GameResultPage } from './pages/GameResultPage';
import { StickyNav } from './components/game/StickyNav';
import { HeroSection } from './components/game/HeroSection';
import { PageSync } from './components/game/PageSync';

function AppRoutes() {
  const { page } = useGameState();
  const dispatch = useGameDispatch();

  switch (page) {
    case 'page-landing':
      return <HeroSection landing onCtaClick={() => dispatch({ type: 'SET_PAGE', page: 'page-home' })} />;
    case 'page-chat':
      return <GameChatPage />;
    case 'page-love-story':
      return <LoveStoryPage />;
    case 'page-result':
      return <GameResultPage />;
    case 'page-home':
    default:
      return <GameHomePage />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <StickyNav />
        <AppRoutes />
        <PageSync />
      </GameProvider>
    </BrowserRouter>
  );
}
