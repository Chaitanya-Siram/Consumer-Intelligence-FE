import { useEffect } from 'react';
import { CloseIcon } from './Icons.jsx';
import { Rich } from '../utils/text.jsx';

export default function AnalysisModal({ open, title, markdown, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Process markdown into structured lists
  const lines = (markdown || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: 'calc(100vw - 40px)' }}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 600 }}>{title} · Analysis</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '14px', listStyleType: 'disc' }}>
            {lines.map((line, idx) => {
              // Strip leading list symbols like "- " or "* "
              const cleanLine = line.replace(/^[-*]\s+/, '');
              return (
                <li key={idx} style={{ color: 'var(--text-soft)', fontSize: '13.5px', lineHeight: '1.6' }}>
                  <Rich text={cleanLine} />
                </li>
              );
            })}
          </ul>
        </div>
        <div className="modal-footer" style={{ padding: '14px 20px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
          <button className="modal-btn modal-btn-cancel" onClick={onClose} style={{ margin: 0 }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
