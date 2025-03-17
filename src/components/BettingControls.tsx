
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface BettingControlsProps {
  isRunning: boolean;
  onStartStop: () => void;
  onReset: () => void;
  currentBet: number;
}

const BettingControls: React.FC<BettingControlsProps> = ({ 
  isRunning, 
  onStartStop, 
  onReset, 
  currentBet 
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        className={`w-full py-6 text-base ${isRunning 
          ? 'bg-betting-red hover:bg-betting-red/90' 
          : 'bg-betting-green hover:bg-betting-green/90'}`}
        onClick={onStartStop}
      >
        {isRunning ? (
          <><Pause className="mr-2" size={18} /> Stop</>
        ) : (
          <><Play className="mr-2" size={18} /> Start</>
        )}
      </Button>
      
      <Button
        variant="outline"
        className="w-full py-6 text-base border-betting-dark-lighter text-gray-300 hover:text-white"
        onClick={onReset}
      >
        <RotateCcw className="mr-2" size={18} /> Reset
      </Button>
      
      <div className="bg-betting-dark-accent rounded-md flex flex-col items-center justify-center py-2">
        <span className="text-xs text-gray-400">Current Bet</span>
        <span className="text-xl font-medium">${currentBet.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default BettingControls;
