import { 
    Aptos, 
    AptosConfig, 
    Network, 
    AccountAddress,
    TypeTag,
  } from '@aptos-labs/ts-sdk';
  

  const aptosConfig = new AptosConfig({ 
    network: Network.TESTNET 
  });
  const aptos = new Aptos(aptosConfig);
  
  const CONTRACT_ADDRESS = "0xe9cc5dc0fc8c7300c02f627f32ac10772d08bd4effdea773ec784fd9c02a7298";
  const MODULE_NAME = "PredictionPool";
  const AI_TOKEN_TYPE = "0x9cfad7bb8544a67d6ec24801dd08d6aaa525e25980323afadb9a69dcddd432e9::ai_token::AIToken";
  
  /**
   * 
   * @param accountObject 
   * @param poolId 
   * @param option 
   * @param amount 
   * @returns 
   */
  export async function placeBet(
    accountObject: any, 
    poolId: number,
    option: number,
    amount: number
  ): Promise<string> {
    try {
      const payload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::place_bet`,
        functionArguments: [
          CONTRACT_ADDRESS, // owner_addr
          poolId.toString(),  // pool_id
          option.toString(),  // option (1 或 2)
          amount.toString()   // amount
        ],
        typeArguments: []
      };
  
      const response = await accountObject.signAndSubmitTransaction({
        payload
      });
  
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
  
      return response.hash;
    } catch (error) {
      console.error("Error placing bet:", error);
      throw error;
    }
  }
  
  /**
   * 
   * @param poolId
   * @returns
   */
  export async function getPoolInfo(poolId: number) {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_pool_info`,
          functionArguments: [CONTRACT_ADDRESS, poolId.toString()],
          typeArguments: [],
        },
      });
  
      const [
        assetType,
        startTime,
        lockTime,
        endTime,
        status,
        targetPrice,
        optionATotal,
        optionBTotal,
        title,
        optionA,
        optionB,
        isSettled,
        winningOption,
        createdAt
      ] = result;
  
      return {
        assetType,
        startTime: Number(startTime),
        lockTime: Number(lockTime),
        endTime: Number(endTime),
        status: Number(status),
        targetPrice: Number(targetPrice),
        optionATotal: Number(optionATotal),
        optionBTotal: Number(optionBTotal),
        title,
        optionA,
        optionB,
        isSettled: Boolean(isSettled),
        winningOption: Number(winningOption),
        createdAt: Number(createdAt)
      };
    } catch (error) {
      console.error("Error getting pool info:", error);
      throw error;
    }
  }
  
  /**
   * 
   * @param poolId 
   * @param option
   * @returns
   */
  export async function getCurrentOdds(poolId: number, option: number): Promise<number> {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_current_odds`,
          functionArguments: [
            CONTRACT_ADDRESS,
            poolId.toString(), 
            option.toString()
          ],
          typeArguments: [],
        },
      });
  

      const odds = Number(result) / 10000;
      return Number(odds.toFixed(2));
    } catch (error) {
      console.error("Error getting current odds:", error);
      throw error;
    }
  }
  
  /**
   * 
   * @returns
   */
  export async function getActivePools(): Promise<number[]> {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_active_pools`,
          functionArguments: [CONTRACT_ADDRESS],
          typeArguments: [],
        },
      });
  
      return result.map((id: any) => Number(id));
    } catch (error) {
      console.error("Error getting active pools:", error);
      throw error;
    }
  }
  
  /**
   * 
   * @param userAddress 
   * @returns
   */
  export async function getUserBets(userAddress: string): Promise<any[]> {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_user_bets`,
          functionArguments: [CONTRACT_ADDRESS, userAddress],
          typeArguments: [],
        },
      });
  
      return result.map((bet: any) => ({
        poolId: Number(bet.pool_id),
        option: Number(bet.option),
        amount: Number(bet.amount),
        odds: Number(bet.odds) / 10000
      }));
    } catch (error) {
      console.error("Error getting user bets:", error);
      throw error;
    }
  }
