
import React from 'react';
import { motion } from 'framer-motion';

interface BetHistoryPanelProps {
  history: Array<{
    id: number | string;
    amount: number;
    multiplier: number;
    result: 'win' | 'loss';
    profit: number;
    timestamp?: string; // Optional timestamp
    currency?: string;  // Optional currency
  }>;
}

const BetHistoryPanel: React.FC<BetHistoryPanelProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        No bets yet. Start the bot to begin betting.
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {history.map((bet, index) => (
        <motion.div
          key={bet.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex justify-between items-center p-3 mb-2 rounded-md ${
            bet.result === 'win' ? 'bg-betting-green/10' : 'bg-betting-red/10'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">
              Bet #{history.length - index} 
              {bet.timestamp && <span className="ml-1 opacity-70">{new Date(bet.timestamp).toLocaleTimeString()}</span>}
            </span>
            <span className="text-sm">
              ${bet.amount.toFixed(2)} @ {bet.multiplier.toFixed(2)}x
              {bet.currency && <span className="text-xs ml-1 opacity-70">{bet.currency}</span>}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs ${
              bet.result === 'win' ? 'text-betting-green' : 'text-betting-red'
            }`}>
              {bet.result === 'win' ? 'WIN' : 'LOSS'}
            </span>
            <span className={`text-sm font-medium ${
              bet.profit > 0 ? 'text-betting-green' : 'text-betting-red'
            }`}>
              {bet.profit > 0 ? '+' : ''}{bet.profit.toFixed(2)}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BetHistoryPanel;
