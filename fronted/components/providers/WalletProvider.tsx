"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren, useEffect } from "react";
import { useToast } from "../ui/use-toast";
import { NETWORK } from "../../lib/aptos";
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { useWallet, WalletReadyState } from '@aptos-labs/wallet-adapter-react';
import { Network } from "@aptos-labs/ts-sdk";



export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { toast } = useToast();
  


  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ network: Network.TESTNET, 
        aptosApiKeys: {
          [Network.TESTNET]: process.env.NEXT_PUBLIC_APTOS_PRIVATE_API_KEY || "",
        },
       }}
      optInWallets={[
        "Petra",
        "Nightly",
        "Pontem Wallet",
        "Mizu Wallet",
      ]}
      onError={(error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Unknown wallet error",
        });
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
