import { useState, useEffect, useCallback, useRef } from 'react';

const HEADER_OFFSET = 88;

export default function ScrollProgress({ subsections = [], routePath }) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(subsections[0]?.id ?? '');
  const userScrolledRef = useRef(false);

  useEffect(() => {
    setActiveId(subsections[0]?.id ?? '');
    userScrolledRef.current = false;
  }, [routePath]);

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    userScrolledRef.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }, []);

  useEffect(() => {
    if (!subsections.length) return;

    const computeActive = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY;
      setProgress(docHeight > 0 ? scrollY / docHeight : 0);

      if (!userScrolledRef.current && scrollY > 10) {
        userScrolledRef.current = true;
      }
      if (!userScrolledRef.current) return;

      const atBottom = scrollY + 5 >= docHeight;
      if (atBottom && subsections.length > 0) {
        setActiveId(subsections[subsections.length - 1].id);
        return;
      }

      const threshold = scrollY + HEADER_OFFSET + 40;
      let bestId = subsections[0]?.id ?? '';

      for (const s of subsections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= threshold) {
          bestId = s.id;
        } else {
          break;
        }
      }

      setActiveId(bestId);
    };

    const timer = setTimeout(() => {
      window.addEventListener('scroll', computeActive, { passive: true });
      computeActive();
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', computeActive);
    };
  }, [subsections, routePath]);

  if (!subsections.length) return null;

  const rawIndex = subsections.findIndex((s) => s.id === activeId);
  const activeIndex = rawIndex >= 0 ? rawIndex : 0;

  return (
    <div
      className="scroll-progress"
      key={routePath}
      aria-label="Section progress within this chapter"
      data-chapter-dots={subsections.length}
    >
      <div className="scroll-progress-track">
        <div className="scroll-progress-fill" style={{ height: `${progress * 100}%` }} />
      </div>
      <div className="scroll-progress-dots" data-count={subsections.length}>
        {subsections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`scroll-progress-dot${
              i === activeIndex ? ' active' : ''
            }${activeIndex >= 0 && i < activeIndex ? ' passed' : ''}`}
            onClick={() => scrollToId(s.id)}
            aria-label={s.label}
            title={s.label}
          />
        ))}
      </div>
    </div>
  );
}
