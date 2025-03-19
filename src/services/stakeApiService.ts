
export interface StakeBetRequest {
  token: string;
  amount: number;
  multiplier: number;
  currency:string;
  game: 'dice' | 'limbo';
}

export interface StakeBetResponse {
  success: boolean;
  data?: {
    id: string;
    amount: number;
    multiplier: number;
    payout: number;
    currency: string;
    game: string;
    createdAt: string;
  };
  error?: string;
}

// GraphQL query for dice bet
const DICE_BET_MUTATION = `
 mutation DiceBet($amount: Float!, $currency: CurrencyEnum!, $startCard: HiloBetStartCardInput!) {
  hiloBet(amount: $amount, currency: $currency, startCard: $startCard) {
    id
    amount
    payout
    currency
    game
  }
}
`;

// GraphQL query for limbo bet
const LIMBO_BET_MUTATION = `
  mutation LimboBet($amount: Float!, $currency: CurrencyEnum!, multiplierTarget:Float!) {
    limboBet(amount: $amount, multiplierTarget: $multiplierTarget, currency: $currency) {
      id
      amount
      payout
      currency
      multiplierTarget
      game
      createdAt
    }
  }
`;

export const placeBet = async (request: StakeBetRequest): Promise<StakeBetResponse> => {
  try {
    const { token, amount, multiplier, game, currency } = request;
    console.log(currency);
    let mutation = '';
    let variables = {};
    
    if (game === 'dice') {
      // For dice, condition determines if betting over/under
      // Using 'over' by default, multiplier determines target
      mutation = DICE_BET_MUTATION;
      const target = 100 - (95 / multiplier);
      
      variables = {
        amount,
        target,
        currency,
        condition: 'over',
        startCard: {
           suit: "SPADES",
          rank: "ACE"
        }
      };
    } else if (game === 'limbo') {
      // For limbo, just need amount and target multiplier
      mutation = LIMBO_BET_MUTATION;
      variables = {
        amount,
        currency,
        target: multiplier
      };
    }
    
    const response = await fetch('https://stake.bet/_api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify({
        query: mutation,
        variables
      })
    });
    
    const responseData = await response.json();
    
    if (responseData.errors) {
      return {
        success: false,
        error: responseData.errors[0]?.message || 'Unknown error occurred'
      };
    }
    
    // Extract the result based on the game type
    const result = game === 'dice' 
      ? responseData.data?.diceBet
      : responseData.data?.limboBet;
      
    if (!result) {
      return {
        success: false,
        error: 'No bet result returned'
      };
    }
    
    return {
      success: true,
      data: {
        ...result,
        multiplier: multiplier // Adding multiplier to response
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get user balance
export const getUserBalance = async (token: string): Promise<{ success: boolean, balance?: number, error?: string }> => {
  try {
    const query = "query StakeBalances($available: Boolean = true, $vault: Boolean = false) {  user {\r\n    id\r\n    balances {\r\n      available @include(if: $available) {\r\n        currency\r\n        amount\r\n        __typename\r\n      }\r\n      vault @include(if: $vault) {\r\n        currency\r\n        amount\r\n        __typename\r\n      }\r\n      __typename\r\n    }\r\n    __typename\r\n  }\r\n}";
    
    const response = await fetch('https://stake.bet/_api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
//console.log(data);
    if (data.errors) {
      
      return {
        success: false,
        error: data.errors[0]?.message || 'Failed to fetch balance'
      };
    }
    
    if (!data.data?.user?.balances?.length) {
      return {
        success: false,
        error: 'No balance information available'
      };
    }
    
    // Get the first available balance
    //const balance = data.data.user.balances[35].available.amount;
    const balance = data.data.user.balances;
    return {
      success: true,
      balance:balance
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
