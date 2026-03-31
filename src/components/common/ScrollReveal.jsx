import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ScrollReveal({ children, delay = 0, className = '' }) {
  const ref = useScrollReveal();
  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : '';

  return (
    <div ref={ref} className={`reveal${delayClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
