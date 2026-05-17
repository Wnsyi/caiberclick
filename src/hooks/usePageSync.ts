import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../contexts/GameContext';
import type { PageId } from '../contexts/GameContext';

const PAGE_TO_URL: Record<PageId, string> = {
  'page-landing': '/',
  'page-home': '/',
  'page-chat': '/chat',
  'page-love-story': '/love-story',
  'page-result': '/result',
};

export function usePageSync() {
  const { page } = useGameState();
  const navigate = useNavigate();
  const location = useLocation();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const targetUrl = PAGE_TO_URL[page];
    if (targetUrl && location.pathname !== targetUrl) {
      navigate(targetUrl, { replace: true });
    }
  }, [page]);
}
