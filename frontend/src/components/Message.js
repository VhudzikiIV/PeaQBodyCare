import React, { useEffect } from 'react';

const Message = ({ message, clearMessage, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      clearMessage();
    }, 4000);

    return () => clearTimeout(timer);
  }, [clearMessage]);

  return (
    <div className={`message ${type}`}>
      {message}
    </div>
  );
};

export default Message;