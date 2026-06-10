import { BrowserRouter } from 'react-router-dom';
import { GameProvider, useGameState, useGameDispatch } from './contexts/GameContext';
import { useEffect } from 'react';
import { GameHomePage } from './pages/GameHomePage';
import { GameChatPage } from './pages/GameChatPage';
import { LoveStoryPage } from './pages/LoveStoryPage';
import { GameResultPage } from './pages/GameResultPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { StickyNav } from './components/game/StickyNav';
import { HeroSection } from './components/game/HeroSection';
import { PageSync } from './components/game/PageSync';
import { getSession, initCloudBase } from './cloudbase';

/** 启动时检查会话：已登录 → 直接进首页，未登录 → 落地页 */
function AppInit() {
  const dispatch = useGameDispatch();

  useEffect(() => {
    (async () => {
      await initCloudBase();
      const session = getSession();
      if (session) {
        dispatch({ type: 'SET_PAGE', page: 'page-home' });
      }
    })();
  }, [dispatch]);

  return null;
}

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
    case 'page-feedback':
      return <FeedbackPage />;
    case 'page-profile':
      return <ProfilePage />;
    case 'page-home':
    default:
      return <GameHomePage />;
  }
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GameProvider>
        <AppInit />
        <StickyNav />
        <AppRoutes />
        <PageSync />
      </GameProvider>
    </BrowserRouter>
  );
}
