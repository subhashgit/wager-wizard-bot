
import React from 'react';
import { motion } from 'framer-motion';
import { Dice3, ThermometerSun } from 'lucide-react';

interface GameModeSelectorProps {
  currentGame: 'dice' | 'limbo';
  onChange: (game: 'dice' | 'limbo') => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ currentGame, onChange }) => {
  return (
    <div className="flex bg-betting-dark-lighter rounded-lg p-1 border border-betting-dark shadow-inner">
      <button
        className={`relative px-4 py-2 rounded-md transition-all duration-200 ${
          currentGame === 'dice' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
        onClick={() => onChange('dice')}
      >
        {currentGame === 'dice' && (
          <motion.div
            layoutId="gameModeBg"
            className="absolute inset-0 bg-betting-blue rounded-md"
            initial={false}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
          />
        )}
        <span className="relative flex items-center">
          <Dice3 className="mr-2" size={18} />
          Dice
        </span>
      </button>
      
      <button
        className={`relative px-4 py-2 rounded-md transition-all duration-200 ${
          currentGame === 'limbo' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
        onClick={() => onChange('limbo')}
      >
        {currentGame === 'limbo' && (
          <motion.div
            layoutId="gameModeBg"
            className="absolute inset-0 bg-betting-blue rounded-md"
            initial={false}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
          />
        )}
        <span className="relative flex items-center">
          <ThermometerSun className="mr-2" size={18} />
          Limbo
        </span>
      </button>
    </div>
  );
};

export default GameModeSelector;
