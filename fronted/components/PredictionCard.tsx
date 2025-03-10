"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Button
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BetModal from "./BetModal";
import { AlignCenter } from "lucide-react";
import { 
  Aptos, 
  AptosConfig, 
  Network, 
  AccountAddress,
  TypeTag,
} from '@aptos-labs/ts-sdk';
import { getAptosAccount } from "@/utils/place-order";
import { useToast } from '@/components/ui/use-toast';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getBalance, hasClaimedAirdrop } from '@/services/tokenService';
import {  Snackbar, Alert, Paper } from '@mui/material';


const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET 
});
const aptos = new Aptos(aptosConfig);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_PREDICTION_POOL_ADDRESS as string;
const MODULE_NAME = "PredictionPool";
const AI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_AI_TOKEN_ADDRESS as string;
const accountBobPrivateKey = process.env.NEXT_PUBLIC_BOB_PRIVATE_KEY as string;
const bobAccount = getAptosAccount(accountBobPrivateKey)


interface PredictionCardProps {
  id: string;
  title: string;
  status: 'ACTIVE' | 'EXPIRED';
  datetime: string;
  yesOption: {
    text: string;
    odds: string;
  };
  noOption: {
    text: string;
    odds: string;
  };
}

type BetOption = {
  id: string;
  text: string;
  odds: number;
};

type Topic = {
  id: string;
  status: "live" | "next" | "expired" | "later";
  question: string;
  settlementTime: string;
  options: BetOption[];
  prizePool: number;
};

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isActive"
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  width: 320,
  minWidth: 320,
  backgroundColor: isActive 
    ? theme.palette.mode === 'dark' 
      ? 'rgba(156, 39, 176, 0.1)' 
      : 'rgba(156, 39, 176, 0.05)'
    : theme.palette.mode === 'dark'
      ? 'rgba(74, 74, 74, 0.1)'
      : 'rgba(74, 74, 74, 0.05)',
  borderColor: isActive ? theme.palette.primary.main : theme.palette.grey[600],
  borderWidth: 1,
  borderStyle: 'solid',
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 1.5,
}));

const OptionBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
  transition: theme.transitions.create(['background-color', 'border-color'])
}));

export default function PredictionCard({ 
  id, 
  title, 
  status, 
  datetime, 
  yesOption, 
  noOption 
}: PredictionCardProps) {
  const { toast } = useToast();

  

  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"yes" | "no" | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const yesOddsNumber = parseFloat(yesOption.odds.replace("x", ""));
  const noOddsNumber = parseFloat(noOption.odds.replace("x", ""));
  const [userPoints, setUserPoints] = useState('')
  const isActive = status === 'ACTIVE';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isLoggedInUser = useRef(false)
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


  useEffect(() => {
    const  handleCheckClaimedBalance = async () => {
      if (!connected) return
      const resources = await getBalance(account?.address as unknown as string)
      if (resources !== 0) {
        setUserPoints((resources / Math.pow(10, 8)).toString())
      } else {
        setUserPoints('0')
      }
    };

    const intervalId = setInterval(() => {
      if (typeof window !== "undefined") {
        handleCheckClaimedBalance() 
      }
    }, 1500);
  
    return () => clearInterval(intervalId);
  }, [connected, account]);
  
  

  const handleBetClick = (option: "yes" | "no") => {
    setSelectedOption(option);
    setBetModalOpen(true);
  };
  
  const handleModalClose = () => {
    setBetModalOpen(false);
    setSelectedOption(null);
  };
  
  const handlePlaceBet = async (amount: number, calculatedOdds: number) => {
    let option = 1
    let selectedOptionStr = 'Yes'
    if (selectedOption == 'yes') {
      option = 1
      selectedOptionStr = 'Yes Option'
    } else{
      option = 2
      selectedOptionStr = 'No Option'
    }

    setBetModalOpen(false);
    setSelectedOption(null);
    try {
      const pool_id = id.startsWith('#') ? id.slice(1) : id;
      const placeAmount = amount * Math.pow(10, 8)
      if (selectedOption) {
        
      }
      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: `${CONTRACT_ADDRESS}::PredictionPool::place_bet`,
            functionArguments: [
              CONTRACT_ADDRESS,
              pool_id.toString(),
              option.toString(),
              placeAmount.toString()
            ]
          },
        });
        // console.log(`AIToken claimAirdrop signAndSubmitTransaction: `);  
        const executedTransaction =  await aptos.waitForTransaction({
          transactionHash: response.hash,
        });
        // console.log(`AIToken claimAirdrop: `, executedTransaction); 
        if (executedTransaction.success) {
          setSnackbarMessage(`Placed bet on ${selectedOption} for ${amount} AI.APT at ${calculatedOdds}x odds`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage('Placed bet failed');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error("Error claiming airdrop:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      throw error;
    }
  };
  
  const modalTopic: Topic = {
    id: id.replace("#", ""),
    status: isActive ? "live" : "expired",
    question: title,
    settlementTime: datetime,
    options: [
      { id: "a", text: yesOption.text, odds: yesOddsNumber },
      { id: "b", text: noOption.text, odds: noOddsNumber }
    ],
    prizePool: 10000
  };
  
  const modalOption: BetOption = selectedOption === "yes" 
    ? { id: "a", text: yesOption.text, odds: yesOddsNumber }
    : { id: "b", text: noOption.text, odds: noOddsNumber };



  
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <StyledCard isActive={isActive} sx={{ borderColor: isActive ? '#9C27B0' : '#4a4a4a' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
            <Chip 
              label={status} 
              size="small" 
              color={isActive ? "primary" : "default"}
              sx={{ 
                color: '#fff',
                fontWeight: 'bold',
                bgcolor: isActive ? 'primary.main' : 'grey.600',
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              {id}
            </Typography>
          </Box>
          
          <Typography variant="h6" component="h2" gutterBottom>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {datetime}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* YES Option */}
            <Box>
              <Button 
                variant="contained" 
                color="success" 
                size="small" 
                sx={{
                  bgcolor: 'rgb(28, 172, 149)', 
                  color: 'white',
                  border: '1px solid rgb(28, 172, 149)',
                  mb: -1, 
                  width: 'auto', 
                  px: 2,
                  pointerEvents: isActive ? 'auto' : 'none',
                  opacity: isActive ? 1 : 0.7
                }}
                onClick={() => handleBetClick("yes")}
                disabled={!isActive}
              >
                YES {yesOption.odds}
              </Button>
              <OptionBox 
                sx={{
                  bgcolor: 'rgb(42, 49, 63)', 
                  color: 'rgb(28, 172, 149)',
                  border: '1px solid rgb(28, 172, 149)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '60px',
                  pointerEvents: isActive ? 'auto' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => handleBetClick("yes")}
              >
                <Typography variant="body2">{yesOption.text}</Typography>
              </OptionBox>
            </Box>
            
            {/* NO Option */}
            <Box>
              <Button 
                variant="contained" 
                color="error" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgb(228, 43, 135)', 
                  color: 'white',
                  border: '1px solid rgb(228, 43, 135)',
                  mb: -1, 
                  width: 'auto', 
                  px: 2,
                  pointerEvents: isActive ? 'auto' : 'none',
                  opacity: isActive ? 1 : 0.7
                }}
                onClick={() => handleBetClick("no")}
                disabled={!isActive}
              >
                NO {noOption.odds}
              </Button>
              <OptionBox 
                sx={{
                  bgcolor: 'rgb(42, 49, 63)', 
                  color: 'rgb(228, 43, 135)', 
                  border: '1px solid rgb(228, 43, 135)',
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '60px',
                  cursor: 'pointer',
                }}
                onClick={() => handleBetClick("no")}
              >
                <Typography variant="body2" sx={{
                }}>{noOption.text}</Typography>
              </OptionBox>
            </Box>
          </Box>
        </CardContent>
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
      </StyledCard>
      
      {selectedOption && (
        <BetModal
          open={betModalOpen}
          topic={modalTopic}
          option={modalOption}
          userPoints={Number(userPoints)}
          onClose={handleModalClose}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </>
  );
}
