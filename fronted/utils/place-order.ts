
import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import {
  Account,
  AccountAddressInput,
  Aptos,
  Ed25519Account,
  Ed25519PrivateKey,
  type InputEntryFunctionData,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { useEffect } from "react";


let merkleClientInstance: MerkleClient | null = null;
let aptosClientInstance: Aptos | null = null;
let aptosAccount: Ed25519Account;


const accountPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;


export const createAptosAccount = () => {
  const walletAccount = Account.generate();
  // get current account privatekey
  const privateKey: Ed25519PrivateKey = walletAccount.privateKey;
  const walletAddress = walletAccount.accountAddress.toString();
  const walletPrivateKey = privateKey.toString();
  return { walletAddress, walletPrivateKey };
}


export const getAptosAccount = (privateKey: string) => {
  const account = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(
      PrivateKey.formatPrivateKey(privateKey, PrivateKeyVariants.Ed25519),
    ),
  });
  return account;
}


// initialize clients
const initMerkleClient = async () => {
  if (merkleClientInstance && aptosClientInstance) {
    return { merkle: merkleClientInstance, aptos: aptosClientInstance };
  }
    
  const merkle = new MerkleClient(await MerkleClientConfig.testnet());
  const aptos = new Aptos(merkle.config.aptosConfig);
    
  merkleClientInstance = merkle;
  aptosClientInstance = aptos;
    
  return { merkle, aptos };
}


export const getWalletUsdcBalance = async (accountAddress: AccountAddressInput) => {
  const { merkle } = await initMerkleClient();
  const usdcBalance = await merkle.getUsdcBalance({
    accountAddress: accountAddress,
  });
  const numberUsdcBalance = Number(usdcBalance) / 1e6;
  return numberUsdcBalance;
}


// place order or transaction
const sendTransaction = async (aptos:Aptos, account: Ed25519Account, payload: InputEntryFunctionData) => {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: payload,
  });
  const { hash } = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });
  return await aptos.waitForTransaction({ transactionHash: hash });
}

const getTransactionStatus = async (aptos: Aptos, txHash: string) => {
  // Wait for a transaction to complete using its hash
  const transactionHash = txHash;
  const transactionResponse = await aptos.waitForTransaction({
    transactionHash,
    options: {
      timeoutSecs: 60, // specify your own timeout if needed
      checkSuccess: true,
    },
  });
  // console.log(transactionResponse);
  // return transactionResponse
  const isSuccess = transactionResponse.success;
  if (isSuccess) {
    return true;
  } else {
    return false;
  }
}

export const placeMarketOrder = async (isBuy: boolean, pair: string, userAddress: AccountAddressInput, sizeDelta: bigint, collateralDelta: bigint, isIncrease: boolean, stopLossTriggerPrice?: bigint, takeProfitTriggerPrice?: bigint, canExecuteAbovePrice?: boolean) => {
  try {
    const { merkle, aptos } = await initMerkleClient();
    const aptosAccount = getAptosAccount(accountPrivateKey)
    const openPayload = merkle.payloads.placeMarketOrder({
      pair: pair,
      userAddress: userAddress,
      sizeDelta: sizeDelta,
      collateralDelta: collateralDelta,
      isLong: isBuy,
      isIncrease: isIncrease,
      stopLossTriggerPrice: stopLossTriggerPrice,
      takeProfitTriggerPrice: takeProfitTriggerPrice,
      canExecuteAbovePrice: canExecuteAbovePrice,
    });

    const openTx = await sendTransaction(aptos, aptosAccount, openPayload);
    const transactionResponse = await getTransactionStatus(aptos, openTx.hash)
    const isSuccess = transactionResponse;
    let placeorderInfo = ''
    if (isSuccess) {
      return isSuccess;
    } else {
      return isSuccess;
    }
  } catch (error) {
    console.error('transaction failed:', error);
    return false;
  }
}



export const placeLimitOrder = async (isBuy: boolean, pair: string, userAddress: AccountAddressInput, sizeDelta: bigint, collateralDelta: bigint, price: bigint, isIncrease: boolean, stopLossTriggerPrice?: bigint, takeProfitTriggerPrice?: bigint, canExecuteAbovePrice?: boolean) => {
  try {
    const { merkle, aptos } = await initMerkleClient();
    const aptosAccount = getAptosAccount(accountPrivateKey)
    const openPayload = merkle.payloads.placeLimitOrder({
      pair: pair,
      userAddress: userAddress,
      sizeDelta: sizeDelta,
      collateralDelta: collateralDelta,
      price: price,
      isLong: isBuy,
      isIncrease: isIncrease,
      stopLossTriggerPrice: stopLossTriggerPrice,
      takeProfitTriggerPrice: takeProfitTriggerPrice,
      canExecuteAbovePrice: canExecuteAbovePrice,
    });

    const openTx = await sendTransaction(aptos, aptosAccount, openPayload);
    const transactionResponse = await getTransactionStatus(aptos, openTx.hash)
    const isSuccess = transactionResponse;
    return isSuccess;
  } catch (error) {
    console.error('transaction failed:', error);
    return false;
  }
}





