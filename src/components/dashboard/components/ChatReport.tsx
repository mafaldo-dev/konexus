import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface ReportProblemChatProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (msg: { id: string; sector: string; sender: string; message: string; timestamp: string }) => void;
  userSector: string;
  username: string;
}

export default function ReportProblemChat({ isOpen, onClose, onSendMessage, userSector, username }: ReportProblemChatProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() === '') return;

    const newMsg = {
      id: Date.now().toString(),
      sector: userSector,
      sender: username,
      message: message.trim(),
      timestamp: new Date().toLocaleString(),
    };

    onSendMessage(newMsg);
    setMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-lg shadow-lg border border-slate-300 flex flex-col"
        >
          <header className="flex justify-between items-center p-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700">Reportar Problema</h3>
            <button
              onClick={onClose}
              aria-label="Fechar chat"
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>
          </header>

          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva o problema aqui..."
            className="p-3 resize-none border-0 outline-none focus:ring-2 focus:ring-slate-400"
          />

          <div className="flex justify-end p-3 border-t border-slate-200">
            <button
              onClick={handleSend}
              disabled={message.trim() === ''}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-semibold transition"
            >
              Enviar <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
