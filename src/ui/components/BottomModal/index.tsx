import React from 'react';

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export const BottomModal = ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) => {
  return (
    <div
      className="popover-container"
      style={{
        backgroundColor: 'rgba(0,0,0,0.7)'
      }}>
      <div
        style={{
          backgroundColor: '#24282F',
          width: '100%',
          padding: 20,
          borderRadius: 15,
          position: 'fixed',
          bottom: 0
        }}>
        {children}
      </div>
    </div>
  );
};
