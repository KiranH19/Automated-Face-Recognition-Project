import React from 'react';
import { FlashMessage } from '../types';

interface FlashStackProps {
  messages: FlashMessage[];
  onDismiss: (id: string) => void;
}

export const FlashStack: React.FC<FlashStackProps> = ({ messages, onDismiss }) => {
  if (messages.length === 0) return null;

  return (
    <div className="flash-stack">
      {messages.map((msg) => (
        <div key={msg.id} className={`flash ${msg.type}`}>
          <span>{msg.text}</span>
          <button
            className="flash-close"
            type="button"
            onClick={() => onDismiss(msg.id)}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
