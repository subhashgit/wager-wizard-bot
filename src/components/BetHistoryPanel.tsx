
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";

interface BetRecord {
  id: number;
  amount: number;
  multiplier: number;
  result: 'win' | 'loss';
  profit: number;
}

interface BetHistoryPanelProps {
  history: BetRecord[];
}

const BetHistoryPanel: React.FC<BetHistoryPanelProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-betting-dark/30 rounded-md border border-betting-dark-lighter">
        <p className="text-gray-400 text-sm">No bets placed yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-48 rounded-md border border-betting-dark-lighter">
      <AnimatePresence initial={false}>
        <div className="space-y-2 p-1">
          {history.map((bet) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-3 rounded-md ${
                bet.result === 'win' ? 'bg-betting-green/20' : 'bg-betting-red/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    ${bet.amount.toFixed(2)} × {bet.multiplier.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {bet.result === 'win' ? 'Win' : 'Loss'}
                  </span>
                </div>
                <span className={`font-medium ${
                  bet.profit > 0 ? 'text-betting-green' : 'text-betting-red'
                }`}>
                  {bet.profit > 0 ? '+' : ''}{bet.profit.toFixed(2)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </ScrollArea>
  );
};

export default BetHistoryPanel;
