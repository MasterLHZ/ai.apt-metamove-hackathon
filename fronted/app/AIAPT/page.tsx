'use client';
import PredictionMarkets from '../../components/PredictionMarkets';
import DailyCheckIn from '../../components/DailyCheckIn';
import BettingHistory from '../../components/BettingHistory';
import { useEffect, useRef, useState } from 'react';
import ScrollControls from '@/components/ScrollControls';
import PredictionCard from "@/components/PredictionCard";
import AIAPTHeader from '@/components/AIAPTHeader';
import { Account, Aptos, AptosConfig, Network, AccountAddress, TypeTag, SimpleEntryFunctionArgumentTypes } from "@aptos-labs/ts-sdk";
import { Box, Container, Button, Paper, Typography, Snackbar, Alert, Tooltip } from '@mui/material';
import { getAptosAccount } from '@/utils/place-order';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getBalance, hasClaimedAirdrop } from '@/services/tokenService';
import UserGuide from '@/components/UserGuide';





export default function AIAPT() {
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_PREDICTION_POOL_ADDRESS as string;
  const MODULE_NAME = "PredictionPool";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [allBetInfos, setAllBetInfos] = useState([])
  const [betLoading, setBetLoading] = useState(false)



  
  useEffect(() => {
    const fetchActivePools = async () => {
      await getActivePools();
    };
    
    fetchActivePools();
  }, []);

  async function getActivePools(): Promise<void> {
    setBetLoading(true)
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_active_pools`,
          functionArguments: [CONTRACT_ADDRESS],
          typeArguments: [],
        },
      });
      const allPools = [];
      const activePools1 = result[0]
      if (Array.isArray(activePools1)) {
        for (let i = 0; i < activePools1.length; i++) {
            const poolId = Number(activePools1[i]);
            try {
              const info = await getPoolInfo(poolId);
            allPools.push(info);
          } catch (err) {
            console.error(`Error getting pool #${poolId}:`, err);
          }
        }
        setAllBetInfos(allPools)
        setBetLoading(false)
        // console.log('All allPools Info:', allPools);
        }
      else {
        setBetLoading(false)
        setSnackbarMessage('Failed to claimed today. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setBetLoading(false)
      console.error("Error getting active pools:", error);
      throw error;
    }
  }
  

  async function getPoolInfo(poolId: number) {
    try {
      const numericPoolId = Number(poolId);

      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_pool_info`,
          functionArguments: [CONTRACT_ADDRESS, numericPoolId.toString()],
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
  
      const parsedStartTime = Number(startTime);
      const parsedLockTime = Number(lockTime);
      const parsedEndTime = Number(endTime);
      const parsedStatus = Number(status);
      const parsedTargetPrice = Number(targetPrice);
      const parsedOptionATotal = Number(optionATotal);
      const parsedOptionBTotal = Number(optionBTotal);
      const parsedWinningOption = Number(winningOption);
      const parsedCreatedAt = Number(createdAt);
  
      if (isNaN(parsedStartTime) || isNaN(parsedLockTime) || isNaN(parsedEndTime) || 
          isNaN(parsedStatus) || isNaN(parsedTargetPrice) || 
          isNaN(parsedOptionATotal) || isNaN(parsedOptionBTotal) || 
          isNaN(parsedWinningOption) || isNaN(parsedCreatedAt)) {
        throw new Error("Received invalid data from the blockchain.");
      }
  
  
      return {
        assetType,
        startTime: parsedStartTime,
        lockTime: parsedLockTime,
        endTime: parsedEndTime,
        status: parsedStatus,
        targetPrice: parsedTargetPrice,
        optionATotal: parsedOptionATotal,
        optionBTotal: parsedOptionBTotal,
        title,
        optionA,
        optionB,
        isSettled: Boolean(isSettled),
        winningOption: parsedWinningOption,
        createdAt: parsedCreatedAt
      };
    } catch (error) {
      console.error("Error getting pool info:", error);
      throw error;
    }
  }


  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -330,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 330,
        behavior: 'smooth'
      });
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false,
    };
    
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
    return formattedDate.replace(',', '').replace(' ', ' UTC');
  };
  
  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      <AIAPTHeader />
      
      <UserGuide />
      <Box sx={{ mt: '40px',mb: 5 }}>
        <DailyCheckIn />
      </Box>
      
      <Box sx={{ position: 'relative', width: '100%' }}>
      <ScrollControls
        onScrollLeft={handleScrollLeft}
        onScrollRight={handleScrollRight}
      />
      
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto', 
          py: 2, 
          px: 2, 
          width: '100%',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
          },
        }}
      >
        {betLoading ? (
          <Box sx={{ display: 'flex', overflow: 'auto', mb: 3, position: 'relative', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 2, px: 2, width: '100%', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
                Loading...
              </Typography>
            </Box>
          </Box>
        ) : allBetInfos.length === 0 ? (
          <Box sx={{ display: 'flex', overflow: 'auto', mb: 3, position: 'relative', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 2, px: 2, width: '100%', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
                No Data...
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', overflow: 'auto', mb: 3, position: 'relative', }}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 2, px: 2, width: '100%', }}>
              {allBetInfos.map((betInfo, index) => (
                <PredictionCard 
                  key={index}
                  id={`#${index + 1}`} 
                  title={betInfo.title}
                  status={betInfo.isSettled ? "EXPIRED" : "ACTIVE"}
                  datetime={formatDate(betInfo.endTime)} 
                  yesOption={{ text: betInfo.optionA, odds: "1x" }}
                  noOption={{ text: betInfo.optionB, odds: "1x" }}
                />
              ))}
            </Box>
          </Box>
          )
        }
      </Box>
      </Box>
      
      
      <Box sx={{ mb: 3 }}>
        <BettingHistory />
      </Box>
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
    </Container>
  );
}
