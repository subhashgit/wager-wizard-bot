import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, PlusCircle, MinusCircle, DollarSign } from "lucide-react";
import BettingControls from "./BettingControls";
import GameModeSelector from "./GameModeSelector";
import BetHistoryPanel from "./BetHistoryPanel";
import StakeApiCredentials from "./StakeApiCredentials";
import { placeBet, getUserBalance } from "../services/stakeApiService";
import { motion } from "framer-motion";

interface BettingInterfaceProps {
  className?: string;
}

const BettingInterface: React.FC<BettingInterfaceProps> = ({ className }) => {
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [apiToken, setApiToken] = useState<string>('');
  const [userBalance, setUserBalance] = useState([]);
  
  const [baseAmount, setBaseAmount] = useState<string>('0.00');
  const [currency, setCurrency] = useState<string>('usdc');
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentGame, setCurrentGame] = useState<'dice' | 'limbo'>('dice');
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [increaseOnLoss, setIncreaseOnLoss] = useState<string>('0.1');
  const [stopOnWin, setStopOnWin] = useState<boolean>(false);
  const [betCount, setBetCount] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [betHistory, setBetHistory] = useState<Array<{id: number | string, amount: number, multiplier: number, result: 'win' | 'loss', profit: number, timestamp?: string, currency?: string}>>([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleApiConnection = (connected: boolean, token: string) => {
    setIsApiConnected(connected);
    setApiToken(token);
    
    if (connected && token) {
      fetchUserBalance(token);
    } else {
      setUserBalance(null);
    }
  };

  const fetchUserBalance = async (token: string) => {
    const result = await getUserBalance(token);
    if (result.success && result.balance !== undefined) {
      setUserBalance(result.balance);
    } else if (result.error) {
      toast.error("Failed to fetch balance", {
        description: result.error,
      });
    }
  };

  useEffect(() => {
    if (!isRunning || !isApiConnected || !apiToken) return;
    
    let isCancelled = false;
    let currentBetAmount = parseFloat(baseAmount) || 0;
    let consecutiveLosses = 0;
    
    const placeBetWithApi = async () => {
      if (isCancelled) return;
      
      if (betCount % 5 === 0) {
        fetchUserBalance(apiToken);
      }
      
      if (userBalance !== null && currentBetAmount > userBalance) {
        toast.error("Insufficient balance", {
          description: "Bet amount exceeds available balance.",
        });
        setIsRunning(false);
        return;
      }
      
      setCurrentBet(currentBetAmount);
      
      try {
        const response = await placeBet({
          token: apiToken,
          amount: currentBetAmount,
          multiplier: targetMultiplier,
          currency: currency,
          game: currentGame
        });
        
        if (response.success && response.data) {
          const isWin = response.data.payout > response.data.amount;
          const betProfit = isWin 
            ? response.data.payout - response.data.amount 
            : -response.data.amount;
          
          setBetCount(prev => prev + 1);
          setProfit(prev => prev + betProfit);
          
          setBetHistory(prev => {
            const newHistory = [
              {
                id: response.data!.id,
                amount: response.data!.amount,
                multiplier: response.data!.multiplier,
                result: isWin ? 'win' : 'loss' as 'win' | 'loss',
                profit: betProfit,
                timestamp: response.data!.createdAt,
                currency: response.data!.currency
              },
              ...prev
            ];
            return newHistory.slice(0, 100);
          });
          
          if (isWin && betProfit > currentBetAmount) {
            toast.success("Winner!", {
              description: `Multiplier: ${targetMultiplier}x - Profit: $${betProfit.toFixed(2)}`,
              position: "bottom-right",
            });
          }
          
          if (isWin) {
            currentBetAmount = parseFloat(baseAmount) || 0;
            consecutiveLosses = 0;
            
            if (stopOnWin) {
              setIsRunning(false);
              return;
            }
          } else {
            consecutiveLosses++;
            const increaseAmount = parseFloat(increaseOnLoss) || 0;
            if (increaseAmount > 0) {
              currentBetAmount = currentBetAmount + (currentBetAmount * increaseAmount);
            }
          }
          
          fetchUserBalance(apiToken);
        } else if (response.error) {
          toast.error("Bet failed", {
            description: response.error,
          });
          
          if (response.error.includes("balance") || response.error.includes("funds")) {
            setIsRunning(false);
            fetchUserBalance(apiToken);
          }
        }
      } catch (error) {
        toast.error("Error placing bet", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
      
      if (isRunning && !isCancelled) {
        setTimeout(placeBetWithApi, 3000);
      }
    };
    
    placeBetWithApi();
    
    return () => {
      isCancelled = true;
    };
  }, [isRunning, isApiConnected, apiToken, baseAmount, currency,targetMultiplier, currentGame, increaseOnLoss, stopOnWin, betCount, userBalance]);

  useEffect(() => {
    if (!isRunning || isApiConnected) return;
    
    const interval = setInterval(() => {
      const betAmount = parseFloat(baseAmount) || 0;
      const currentMultiplier = targetMultiplier;
      
      const win = Math.random() > 0.5;
      const newProfit = win ? profit + (betAmount * currentMultiplier - betAmount) : profit - betAmount;
      
      setBetCount(prev => prev + 1);
      setProfit(newProfit);
      setCurrentBet(betAmount);
      
      setBetHistory(prev => {
        const newHistory = [
          {
            id: Date.now(),
            amount: betAmount,
            multiplier: currentMultiplier,
            result: win ? 'win' : 'loss' as 'win' | 'loss',
            profit: win ? betAmount * currentMultiplier - betAmount : -betAmount
          },
          ...prev
        ];
        return newHistory.slice(0, 100);
      });
      
      if (win && betAmount * currentMultiplier > betAmount * 2) {
        toast("Winner!", {
          description: `Multiplier: ${currentMultiplier}x - Profit: $${(betAmount * currentMultiplier - betAmount).toFixed(2)}`,
          position: "bottom-right",
        });
      }
      
      if (win && stopOnWin) {
        setIsRunning(false);
      }
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isRunning, baseAmount, targetMultiplier, profit, stopOnWin, isApiConnected]);

  const handleStartStop = () => {
    if (parseFloat(baseAmount) <= 0) {
      toast.error("Please enter a valid bet amount", {
        position: "bottom-center",
      });
      return;
    }
    
    if (isApiConnected && !apiToken) {
      toast.error("API connection required", {
        description: "Please connect to Stake API before starting.",
        position: "bottom-center",
      });
      return;
    }
    
    setIsRunning(!isRunning);
    
    toast(isRunning ? "Bot stopped" : "Bot started", {
      position: "bottom-center",
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setBetCount(0);
    setProfit(0);
    setCurrentBet(0);
    setBetHistory([]);
    
    toast("Stats reset", {
      position: "bottom-center",
    });
  };
// console.log(userBalance); 


  return (
    <motion.div 
      className={`max-w-6xl mx-auto p-4 ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="flex flex-col space-y-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-betting-dark-accent border-betting-dark-lighter p-6 backdrop-blur-md">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-gradient-to-br from-betting-blue to-indigo-600 rounded-full flex items-center justify-center">
                  <DollarSign size={24} className="text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-betting-dark rounded-full border-2 border-betting-blue"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Wager Wizard</h1>
                  <p className="text-gray-400">Stake.com betting interface</p>
                </div>
              </div>
              
              <GameModeSelector 
                currentGame={currentGame} 
                onChange={setCurrentGame} 
              />
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StakeApiCredentials onApiConnected={handleApiConnection} />
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="bg-betting-dark-accent border-betting-dark-lighter overflow-hidden h-full">
              <Tabs defaultValue="static" className="w-full">
                <TabsList className="w-full bg-betting-dark rounded-none border-b border-betting-dark-lighter">
                  <TabsTrigger value="static" className="w-1/3 py-3 data-[state=active]:bg-betting-blue">
                    Static Target
                  </TabsTrigger>
                  <TabsTrigger value="random" className="w-1/3 py-3 data-[state=active]:bg-betting-blue">
                    Random Target
                  </TabsTrigger>
                  <TabsTrigger value="combo" className="w-1/3 py-3 data-[state=active]:bg-betting-blue">
                    Combo Target
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="static" className="p-6 space-y-6 animate-enter">
                  <div className="space-y-4">
                    {isApiConnected && userBalance !== null && (
                      <div className="bg-betting-dark/40 p-3 rounded-md flex items-center justify-between">
                        <span className="text-sm text-gray-300">Available Balance:</span>
                        <span className="font-medium text-betting-green">

                          <select onChange={(e) => setCurrency(e.target.value)}>
                          {userBalance.map(item => (
                              <option key={item.key} value={item.available.currency}>
                                <h1>{item.available.currency}</h1>
                                (<p>{item.available.amount}</p>)
                              </option>
                            ))}

                          </select>
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="base-amount" className="text-sm text-gray-400">
                        Base Bet Amount (USDC)
                      </Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <input
                          id="base-amount"
                          type="text"
                          value={baseAmount}
                          onChange={(e) => setBaseAmount(e.target.value)}
                          className="input-field pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="target-multiplier" className="text-sm text-gray-400">
                        Target Multiplier: {targetMultiplier.toFixed(2)}x
                      </Label>
                      <Slider
                        id="target-multiplier"
                        defaultValue={[2.0]}
                        min={1.01}
                        max={100}
                        step={0.01}
                        value={[targetMultiplier]}
                        onValueChange={(value) => setTargetMultiplier(value[0])}
                        className="my-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="increase-on-loss" className="text-sm text-gray-400">
                        Increase On Loss
                      </Label>
                      <input
                        id="increase-on-loss"
                        type="text"
                        value={increaseOnLoss}
                        onChange={(e) => setIncreaseOnLoss(e.target.value)}
                        className="input-field mt-1.5"
                        placeholder="0.1"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="stop-win"
                        checked={stopOnWin}
                        onCheckedChange={setStopOnWin}
                      />
                      <Label htmlFor="stop-win" className="text-sm text-gray-300">
                        Stop on Win
                      </Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="random" className="p-6 animate-enter">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="min-multiplier" className="text-sm text-gray-400">
                        Min Multiplier
                      </Label>
                      <input
                        id="min-multiplier"
                        type="text"
                        defaultValue="1.5"
                        className="input-field mt-1.5"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max-multiplier" className="text-sm text-gray-400">
                        Max Multiplier
                      </Label>
                      <input
                        id="max-multiplier"
                        type="text"
                        defaultValue="10"
                        className="input-field mt-1.5"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="change-on-win"
                        defaultChecked={false}
                      />
                      <Label htmlFor="change-on-win" className="text-sm text-gray-300">
                        Only change on win
                      </Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="combo" className="p-6 animate-enter">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="multiplier-1" className="text-sm text-gray-400">
                          Multiplier 1
                        </Label>
                        <input
                          id="multiplier-1"
                          type="text"
                          defaultValue="2"
                          className="input-field mt-1.5"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="multiplier-2" className="text-sm text-gray-400">
                          Multiplier 2
                        </Label>
                        <input
                          id="multiplier-2"
                          type="text"
                          defaultValue="3"
                          className="input-field mt-1.5"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        size="sm"
                        className="bg-betting-green hover:bg-betting-green/90 text-white flex items-center gap-1"
                      >
                        <PlusCircle size={14} /> Add Multiplier
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-betting-red hover:bg-betting-red/90 text-white flex items-center gap-1"
                      >
                        <MinusCircle size={14} /> Remove Last
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm text-gray-400">
                        Combo Multiplier: <span className="text-white font-medium">6.00</span>
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-6 border-t border-betting-dark-lighter bg-betting-dark/30">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    className={`w-full py-6 text-base ${isRunning 
                      ? 'bg-betting-red hover:bg-betting-red/90' 
                      : 'bg-betting-green hover:bg-betting-green/90'}`}
                    onClick={handleStartStop}
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
                    onClick={handleReset}
                  >
                    <RotateCcw className="mr-2" size={18} /> Reset
                  </Button>
                  
                  <div className="bg-betting-dark-accent rounded-md flex flex-col items-center justify-center py-2">
                    <span className="text-xs text-gray-400">Current Bet</span>
                    <span className="text-xl font-medium">${currentBet.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="bg-betting-dark-accent border-betting-dark-lighter h-full">
              <div className="p-6 border-b border-betting-dark-lighter">
                <h3 className="font-medium text-lg mb-4">Betting Statistics</h3>
                
                <div className="space-y-4">
                  <div className="bg-betting-dark/40 rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Bets</span>
                      <span className="text-xl font-medium">{betCount}</span>
                    </div>
                  </div>
                  
                  <div className="bg-betting-dark/40 rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Profit/Loss</span>
                      <span className={`text-xl font-medium ${
                        profit > 0 ? 'text-betting-green' : profit < 0 ? 'text-betting-red' : ''
                      }`}>
                        ${profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-medium text-lg mb-4">Recent Bets</h3>
                <BetHistoryPanel history={betHistory} />
              </div>
            </Card>
          </motion.div>
        </div>
        
        <motion.div variants={itemVariants}>
          <Card className="bg-betting-dark-accent border-betting-dark-lighter p-6">
            <h3 className="font-medium text-lg mb-4">Bot Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-betting-green animate-pulse' : 'bg-betting-red'}`}></div>
                <span className="text-sm">{isRunning ? 'Running' : 'Stopped'}</span>
              </div>
              
              <div className="text-sm text-gray-400">
                {currentGame === 'dice' ? 'Game Mode: Dice' : 'Game Mode: Limbo'} • Target: {targetMultiplier.toFixed(2)}x
                {isApiConnected && <span className="ml-2 text-betting-blue">• Using Stake API</span>}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default BettingInterface;
