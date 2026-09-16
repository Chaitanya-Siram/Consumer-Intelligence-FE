export default function CanvasTabBar({ activeTab, onTabChange }) {
  const TABS = [
    { id: 'configure', label: 'Configure' },
    { id: 'review',    label: 'Review'    },
    { id: 'output',    label: 'Output'    },
  ];

  return (
    <div 
      className="glass-panel wftop__tabs"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '4px', 
        background: 'rgba(255, 255, 255, 0.45)', 
        borderRadius: '24px', 
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid rgba(255,255,255,0.4)',
        gap: '4px'
      }}
    >
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              height: '32px',
              padding: '0 20px',
              borderRadius: '17px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
              transition: 'all 150ms ease-in-out',
              background: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? '#0F0F11' : 'rgba(0,0,0,0.55)',
              boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(0,0,0,0.75)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(0,0,0,0.55)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
