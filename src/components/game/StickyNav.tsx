import { useState, useEffect } from 'react';
import { useGameState } from '../../contexts/GameContext';

export function StickyNav() {
  const { page } = useGameState();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = page === 'page-home';

  return (
    <nav
      className={`sticky-nav${scrolled ? ' scrolled' : ''}`}
      style={{ display: isHome ? 'flex' : 'none' }}
    >
      <div className="nav-left">
        <img
          className="nav-logo-img"
          src="images/logo.jpg"
          alt="人生体验卡"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className="nav-center">
        <span className="nav-dropdown">
          <a onClick={() => document.getElementById('comp1')?.scrollIntoView({ behavior: 'smooth' })}>
            首页
          </a>
          <div className="nav-dropdown-card">
            <p>这是一个结合了二次元的心理诊疗所。我们通过沉静式体验，根据你的选择来判断你的人格。根据每个人格，我们都会开出不一样的处方哦！快来试试吧！对了，每个人格都有一个代表人物哦，点击人格介绍，看看有没有你喜欢的角色吧！</p>
          </div>
        </span>
        <a onClick={() => document.getElementById('comp2Upper')?.scrollIntoView({ behavior: 'smooth' })}>
          人格介绍
        </a>
        <a onClick={() => document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' })}>
          体验卡
        </a>
        <a onClick={() => document.getElementById('comp3')?.scrollIntoView({ behavior: 'smooth' })}>
          恋爱卡
        </a>
        <a onClick={() => document.getElementById('comp4')?.scrollIntoView({ behavior: 'smooth' })}>
          关于
        </a>
      </div>
      <div className="nav-right">
        <button
          className="nav-btn"
          onClick={() => {
            document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          开始
        </button>
      </div>
    </nav>
  );
}
