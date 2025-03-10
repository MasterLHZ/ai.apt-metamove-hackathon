import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
// import { useWallet } from "@aptos-labs/wallet-adapter-react";
// const {
//     account,
//     changeNetwork,
//     connect,
//     connected,
//     disconnect,
//     network,
//     signAndSubmitTransaction,
//     signMessage,
//     signMessageAndVerify,
//     signTransaction,
//     submitTransaction,
//     wallet,
//     wallets,
//   } = useWallet();

const AI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_AI_TOKEN_ADDRESS as string;


const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET 
});
const aptos = new Aptos(aptosConfig);

export async function getBalance(userAddress: string) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${AI_TOKEN_ADDRESS}::ai_token::balance`,
        functionArguments: [userAddress],
        typeArguments: [],
      },
    });

    return Number(result);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

export async function hasClaimedAirdrop(userAddress: string) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${AI_TOKEN_ADDRESS}::ai_token::has_claimed`,
        functionArguments: [userAddress, AI_TOKEN_ADDRESS],
        typeArguments: [],
      },
    });
    // console.log('userAddress hasClaimedAirdrop', result)

    return Boolean(result[0]);
  } catch (error) {
    console.error("Error checking claim status:", error);
    return false;
  }
}


export async function claimAirdrop(account: any) {
  try {
    const payload = {
      function: `${AI_TOKEN_ADDRESS}::ai_token::claim_airdrop`,
      functionArguments: [AI_TOKEN_ADDRESS],
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
    console.error("Error claiming airdrop:", error);
    throw error;
  }
}
