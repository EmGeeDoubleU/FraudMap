export default function Callout({ variant = 'neutral', headline, children, style, className = '' }) {
  return (
    <div className={`callout callout-${variant} ${className}`.trim()} style={style}>
      {headline && <div className="callout-headline">{headline}</div>}
      {children}
    </div>
  );
}
