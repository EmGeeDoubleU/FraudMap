import { useState } from 'react';

export default function ExpandableCallout({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="expandable-callout">
      <button
        className="expandable-callout-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="expandable-callout-title">{title}</span>
        <span className="expandable-callout-toggle">
          {open ? 'Collapse' : 'Expand'}
        </span>
      </button>
      <div className={`expandable-callout-body${open ? ' open' : ''}`}>
        <div className="expandable-callout-content">
          {children}
        </div>
      </div>
    </div>
  );
}
