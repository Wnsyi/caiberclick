import { BrowserRouter } from 'react-router-dom';
import { GameProvider, useGameState } from './contexts/GameContext';
import { GameHomePage } from './pages/GameHomePage';
import { GameChatPage } from './pages/GameChatPage';
import { LoveStoryPage } from './pages/LoveStoryPage';
import { GameResultPage } from './pages/GameResultPage';
import { StickyNav } from './components/game/StickyNav';
import { PageSync } from './components/game/PageSync';

function AppRoutes() {
  const { page } = useGameState();

  switch (page) {
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
