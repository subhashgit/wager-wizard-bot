
import React from "react";
import BettingInterface from "@/components/BettingInterface";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-betting-dark to-betting-dark/95 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(55,97,248,0.03)_0%,rgba(15,23,42,0)_100%)]"></div>
      
      {/* Glass orbs for aesthetic effect */}
      <div className="absolute top-32 -left-60 w-96 h-96 rounded-full bg-betting-blue/10 blur-3xl"></div>
      <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl"></div>
      
      <div className="relative z-10 min-h-screen py-10">
        <BettingInterface />
      </div>
    </div>
  );
};

export default Index;
