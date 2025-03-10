import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';


const PREDICTION_POOL_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_PREDICTION_POOL_ADDRESS as string;


const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET 
});
const aptos = new Aptos(aptosConfig);

export async function getActivePools() {
  try {
    const result = await aptos.view({
      payload: {
        function: `${PREDICTION_POOL_ADDRESS}::PredictionPool::get_active_pools`,
        functionArguments: [PREDICTION_POOL_ADDRESS],
        typeArguments: [],
      },
    });

    return result.map((id: string) => Number(id));
  } catch (error) {
    console.error("Error fetching active pools:", error);
    return [];
  }
}

export async function getPoolInfo(poolId: number) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${PREDICTION_POOL_ADDRESS}::PredictionPool::get_pool_info`,
        functionArguments: [PREDICTION_POOL_ADDRESS, poolId.toString()],
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
      id: poolId,
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
    console.error(`Error fetching pool info for pool #${poolId}:`, error);
    throw error;
  }
}


export async function getCurrentOdds(poolId: number, option: number) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${PREDICTION_POOL_ADDRESS}::PredictionPool::get_current_odds`,
        functionArguments: [
          PREDICTION_POOL_ADDRESS, 
          poolId.toString(), 
          option.toString()
        ],
        typeArguments: [],
      },
    });

    return Number(result);
  } catch (error) {
    console.error("Error getting odds:", error);
    return 10000;
  }
}

export async function getUserBets(userAddress: string) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${PREDICTION_POOL_ADDRESS}::PredictionPool::get_user_bets`,
        functionArguments: [PREDICTION_POOL_ADDRESS, userAddress],
        typeArguments: [],
      },
    });

    return result.map((bet: any) => ({
      poolId: Number(bet.pool_id),
      option: Number(bet.option),
      amount: Number(bet.amount),
      odds: Number(bet.odds)
    }));
  } catch (error) {
    console.error("Error getting user bets:", error);
    return [];
  }
}


export async function placeBet(account: any, poolId: number, option: number, amount: number) {
  try {
    const payload = {
      function: `${PREDICTION_POOL_ADDRESS}::PredictionPool::place_bet`,
      functionArguments: [
        PREDICTION_POOL_ADDRESS,
        poolId.toString(),
        option.toString(),
        amount.toString()
      ],
      typeArguments: [],
    };

    const response = await account.signAndSubmitTransaction({
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
