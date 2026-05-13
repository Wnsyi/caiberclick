import { useRef, useEffect } from 'react';
import { FILM_IMAGES } from '../../data/gacha';

export function FilmStrip() {
  const upperRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const upper = upperRef.current;
    const lower = lowerRef.current;
    if (upper && lower) {
      lower.style.height = upper.offsetHeight * 3.6 + 'px';
      const shape = lower.querySelector('.comp4-shape') as HTMLElement;
      if (shape) shape.style.top = upper.offsetHeight * 0.25 + 'px';
    }
  }, []);

  const frames = FILM_IMAGES.map((src, i) => (
    <div className="film-frame" key={i}>
      <img src={src} alt="" draggable={false} loading="lazy" />
    </div>
  ));

  return (
    <section className="comp4" id="comp4">
      <div className="comp4-upper" ref={upperRef}>
        <div className="film-strip">
          <div className="film-strip-inner">
            <div className="film-track" id="filmTrack">
              {frames}
              {frames}
            </div>
          </div>
        </div>
      </div>
      <div className="comp4-lower" ref={lowerRef}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="comp4ShapeClip" clipPathUnits="objectBoundingBox">
              <path d="M 0,0.22 C 0.01,0.38 0.025,0.48 0.05,0.08 C 0.06,0.02 0.08,0.05 0.10,0.18 C 0.11,0.32 0.13,0.44 0.17,0.04 C 0.19,0.10 0.20,0.01 0.24,0.15 C 0.26,0.28 0.29,0.50 0.33,0.06 C 0.35,0.02 0.37,0.14 0.40,0.10 C 0.42,0.35 0.44,0.08 0.48,0.03 C 0.50,0.18 0.52,0.46 0.56,0.07 C 0.58,0.01 0.60,0.12 0.64,0.14 C 0.66,0.32 0.68,0.20 0.72,0.05 C 0.74,0.16 0.77,0.45 0.81,0.08 C 0.83,0.02 0.85,0.13 0.89,0.06 C 0.91,0.28 0.93,0.40 0.96,0.04 C 0.98,0.12 0.99,0.25 1,0.10 L 1,1 L 0,1 Z" />
            </clipPath>
          </defs>
        </svg>
        <div className="comp4-shape" />
        <div className="comp4-bottom-row">
          <div className="comp4-info-col">
            <img src="images/logo.jpg" alt="" style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto', opacity: 0.8 }} />
          </div>
          <div className="comp4-info-col">
            <p>本网站所有内容均为虚构<br />请仔细甄别</p>
            <p>本网站设计借鉴<br />https://www.delacalle.mx/</p>
            <p>本网站所有图片均来自其他网页<br />如有侵权 请联系<br />255818502@qq.com。</p>
          </div>
          <div className="comp4-info-col">
            <p>本网站作者<br />桀桀桀<br />陈达不溜皮蛋<br />@^<br />嗡嗡嗡</p>
            <p>如有问题，请联系我们。<br />邮箱：255818502@qq.com<br />电话：188 8888 8888</p>
          </div>
        </div>
      </div>
    </section>
  );
}
