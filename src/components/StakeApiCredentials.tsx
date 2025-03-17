
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, Lock, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StakeApiCredentialsProps {
  onApiConnected: (isConnected: boolean, token: string) => void;
}

const StakeApiCredentials: React.FC<StakeApiCredentialsProps> = ({ onApiConnected }) => {
  const [apiToken, setApiToken] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // On component mount, check if API token is stored in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('stake_api_token');
    if (savedToken) {
      setApiToken(savedToken);
      // Verify token validity
      verifyToken(savedToken);
    }
  }, []);
  
  // Function to verify token validity
  const verifyToken = async (token: string) => {
    setIsLoading(true);
    try {
      // Make a simple query to verify the token
      const response = await fetch('https://stake.bet/_api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        },
        body: JSON.stringify({
          query: `{
            user {
              id
              name
            }
          }`
        })
      });
      
      const data = await response.json();
      
      if (data.data?.user) {
        setIsConnected(true);
        localStorage.setItem('stake_api_token', token);
        onApiConnected(true, token);
        toast.success("Successfully connected to Stake API", {
          description: `Welcome back, ${data.data.user.name || 'User'}!`,
        });
      } else {
        setIsConnected(false);
        localStorage.removeItem('stake_api_token');
        onApiConnected(false, '');
        toast.error("Failed to connect to Stake API", {
          description: "Invalid API token. Please check your credentials.",
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast.error("Failed to connect to Stake API", {
        description: "Connection error. Please try again later.",
      });
      onApiConnected(false, '');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnect = () => {
    if (!apiToken.trim()) {
      toast.error("API token required", {
        description: "Please enter your Stake API token.",
      });
      return;
    }
    
    verifyToken(apiToken);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setApiToken('');
    localStorage.removeItem('stake_api_token');
    onApiConnected(false, '');
    toast.success("Disconnected from Stake API");
  };
  
  return (
    <Card className="bg-betting-dark-accent border-betting-dark-lighter p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Lock className="text-betting-blue" size={20} />
        <h3 className="text-lg font-medium">Stake API Connection</h3>
      </div>
      
      <Alert className="bg-betting-dark/40 border-yellow-600/30 text-yellow-500">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Connecting to Stake API requires your personal API token. This will be stored in your browser.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="api-token" className="text-sm text-gray-400">
            Stake API Token
          </Label>
          <Textarea 
            id="api-token"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your Stake API token here..."
            className="bg-betting-dark/60 border-betting-dark-lighter resize-none mt-1.5"
            rows={3}
            disabled={isConnected}
          />
        </div>
        
        <div className="text-xs text-gray-400">
          <p>Find your API token in Stake.com account settings or browser network requests.</p>
        </div>
        
        <div className="pt-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              className="w-full bg-betting-blue hover:bg-betting-blue/90"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect to Stake API'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="bg-betting-green/10 text-betting-green rounded-md p-3 text-sm flex items-center">
                <Key className="mr-2" size={16} />
                Connected to Stake API
              </div>
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                className="w-full border-betting-dark-lighter"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StakeApiCredentials;
