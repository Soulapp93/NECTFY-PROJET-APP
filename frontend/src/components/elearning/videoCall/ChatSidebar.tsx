
import React from 'react';

interface Message {
  id: number;
  sender: string;
  message: string;
  time: string;
  isInstructor: boolean;
}

interface ChatSidebarProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  messages: Message[];
  chatMessage: string;
  setChatMessage: (message: string) => void;
  onSendMessage: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isChatOpen,
  setIsChatOpen,
  messages,
  chatMessage,
  setChatMessage,
  onSendMessage
}) => {
  return (
    <div className={`absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 transform transition-transform ${
      isChatOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Chat du cours</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-purple-600">{message.sender}</p>
                <span className="text-xs text-gray-500">{message.time}</span>
              </div>
              <p className="text-sm text-gray-700">{message.message}</p>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Tapez votre message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={onSendMessage}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
