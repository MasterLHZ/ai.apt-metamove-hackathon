import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Typography, Snackbar, Alert, Tooltip } from '@mui/material';
import Image from 'next/image';
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { getAptosAccount } from '@/utils/place-order';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getBalance, hasClaimedAirdrop } from '@/services/tokenService';


const accountAlicePrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;
const accountBobPrivateKey = process.env.NEXT_PUBLIC_BOB_PRIVATE_KEY as string;
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
const AI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_AI_TOKEN_ADDRESS as string;


export default function DailyCheckIn() {
  const {
    account,
    changeNetwork,
    connect,
    connected,
    disconnect,
    network,
    signAndSubmitTransaction,
    signMessage,
    signMessageAndVerify,
    signTransaction,
    submitTransaction,
    wallet,
    wallets,
  } = useWallet();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [todayClaimed, setTodayClaimed] = useState(false);

  // Setup the client
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);
  const aliceaccount = getAptosAccount(accountAlicePrivateKey);
  const bobAccount = getAptosAccount(accountBobPrivateKey)
  const [aiapttokenBalance, setAiapttokenBalance] = useState(0)

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isLoggedInUser = useRef(false)



  async function getIs_registeredStatus(userAddress: string) {
    try {
      const result = await aptos.view({
        payload: {
          function: `${AI_TOKEN_ADDRESS}::ai_token::is_registered`,
          functionArguments: [userAddress],
          typeArguments: [],
        },
      });
      return result
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }
  useEffect(() => {

    const fetchClaimedBalance = async () => {
      await handleCheckClaimedBalance();
    };
  
    const intervalId = setInterval(() => {
      if (typeof window !== "undefined") {
        fetchClaimedBalance();
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, [connected, account]);


  async function claimAirdrop() {
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${AI_TOKEN_ADDRESS}::ai_token::claim_airdrop`,
          typeArguments: [],
          functionArguments: [AI_TOKEN_ADDRESS],
        },
      });
      const executedTransaction =  await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      return executedTransaction;
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      throw error;
    }
  }

  const fetchUserIsClaimed = async () => {
    const userClaimed = await hasClaimedAirdrop(account?.address as unknown as string);
    setTodayClaimed(userClaimed);
    return userClaimed;
  }


  const fetchUserIsRegister = async () => {
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${AI_TOKEN_ADDRESS}::ai_token::register`,
          typeArguments: [],
          functionArguments: [],
        },
      });
      const executedTransaction =  await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      return executedTransaction;
    } catch (error) {
      console.error("Error registering token:", error);
      throw error;
    }
  }




  

  const  handleCheckClaimedBalance = async () => {
    if (!connected) return
    const resources = await getBalance(account?.address as unknown as string)
    if (resources !== 0) {
      setAiapttokenBalance(resources / Math.pow(10, 8))
    } else {
      setAiapttokenBalance(0)
    }
  }

  const claimDailyAirdrop = async () => {
    if (connected && account.address) {
      const todayClaimed = await hasClaimedAirdrop(account?.address as unknown as string);
      if (todayClaimed) {
        setSnackbarMessage('Has claimed today. Please try to claim tomorrow');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        //check is_registered status
        const is_registeredStatus = await getIs_registeredStatus(account?.address as unknown as string);
        const is_registeredLS = is_registeredStatus[0]
        if (is_registeredLS) {
          const claimTx = await claimAirdrop();
          if (claimTx.success == true) {
              setSnackbarMessage('Has claimed. Please to claim AI.APT');
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            } else {
              setSnackbarMessage('Failed to claimed today. Please try again.');
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
            }
        } else {
          const registerTx = await fetchUserIsRegister();
          if (registerTx.success == true) {
            setSnackbarMessage('Has Register. Please to claim AI.APT');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            const claimTx = await claimAirdrop();
            if (claimTx.success == true) {
              setSnackbarMessage('Has claimed. Please to claim AI.APT');
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            } else {
              setSnackbarMessage('Failed to claimed today. Please try again.');
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
            }
          }
        }
      }
    } else {
      setSnackbarMessage('Failed to connect wallet. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }


  

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  

  return (
    <Paper 
      sx={{
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderRadius: 2,
        bgcolor: 'rgb(42, 49, 63)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2, p: 1, bgcolor: 'rgba(255, 193, 7, 0.1)', borderRadius: 1 }}>
          <Image
            src="/gift-icon.svg"
            alt="Daily Check-in"
            width={24}
            height={24}
          />
        </Box>
        <Box>
          <Typography variant="h6" component="h2">
            Daily Check-In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Balance: {aiapttokenBalance} AI.APT
          </Typography>
        </Box>
      </Box>
      
      <Button
        variant="contained"
        color="primary"
        sx={{ 
          bgcolor: '#f7b924', 
          '&:hover': { bgcolor: '#e5a50d' },
          color: '#000',
          fontWeight: 'bold',
        }}
        onClick={claimDailyAirdrop}
      >
        Claim 500 AI.APT
      </Button>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}