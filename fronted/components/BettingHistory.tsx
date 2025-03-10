// src/components/BettingHistory.tsx
import { useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Account, Aptos, AptosConfig, Network, AccountAddress, TypeTag, SimpleEntryFunctionArgumentTypes } from "@aptos-labs/ts-sdk";
import { getAptosAccount } from '@/utils/place-order';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { 
  Box, 
  Container, 
  Button, 
  Paper, 
  Typography, 
  Snackbar, 
  Alert, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';



const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_APTOS_CONTRACT_PREDICTION_POOL_ADDRESS as string;
const MODULE_NAME = "PredictionPool";



interface BetRecord {
  pool_id: string;
  option: number;
  amount: string;
  odds: string;
}


interface IntegrateBetRecord {
  assetType: string;
  startTime: number;
  lockTime: number;
  endTime: number;
  status: number;
  targetPrice: number;
  optionATotal?: number;
  optionBTotal?: number;
  title?: string;
  optionA?: string;
  optionB?: string;
  isSettled?: boolean;
  winningOption?: number;
  createdAt: number;
}


interface PoolInfo {
  title?: string;
  status?: number;
  optionA?: string;
  optionB?: string;
  targetPrice?: number;
  isSettled?: boolean;
  winningOption?: number;
  [key: string]: any;
}


export default function BettingHistory() {
  const [expanded, setExpanded] = useState(false);
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [allHistoryInfos, setAllHistoryInfos] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [poolInfoCache, setPoolInfoCache] = useState<Record<string, PoolInfo>>({});
  const [userBetInfos, setUserBetInfos] = useState<IntegrateBetRecord[]>([]);




  const toggleExpand = () => {
    setExpanded(!expanded);
  };


  useEffect(() => {
    if (expanded) {
      const fetchGet_user_bets = async () => {
        await getUserBetsHistory();
      };
      fetchGet_user_bets();
    }
  }, [expanded, connected, account]);
  

  // get_user_bets
  async function getUserBetsHistory() {
    try {
      if (account?.address && connected) {
        const result = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_user_bets`,
            functionArguments: [CONTRACT_ADDRESS, account.address],
            typeArguments: [],
          },
        });
        
        setAllHistoryInfos(result[0] as BetRecord[]);
        if (result && result.length > 0) {
          await fetchPoolInfoForBets(result[0] as BetRecord[]);
        }
      }
    } catch (error) {
      console.error("Error getting pool info:", error);
      setSnackbarMessage("Failed to load betting history");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPoolInfoForBets(bets: BetRecord[]) {
    try {
      const uniquePoolIds = [...new Set(bets.map(bet => bet.pool_id))];
      
      const poolInfoPromises = uniquePoolIds.map(async (pool_id) => {
        const numericPoolId = Number(pool_id);
        const query_poolid = numericPoolId.toString()
        try {
          const result = await aptos.view({
            payload: {
              function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_pool_info`,
              functionArguments: [CONTRACT_ADDRESS, query_poolid],
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
            pool_id,
            info: {
              assetType: String(assetType),
              startTime: Number(startTime),
              lockTime: Number(lockTime),
              endTime: Number(endTime),
              status: Number(status),
              targetPrice: Number(targetPrice),
              optionATotal: Number(optionATotal),
              optionBTotal: Number(optionBTotal),
              title: String(title),
              optionA: String(optionA),
              optionB: String(optionB),
              isSettled: Boolean(isSettled),
              winningOption: Number(winningOption),
              createdAt: Number(createdAt)
            }
          };
        } catch (error) {
          console.error(`Error fetching info for pool ${pool_id}:`, error);
          return { pool_id, info: {} };
        }
      });
      
      const poolInfoResults = await Promise.all(poolInfoPromises);
      
      const userBetInfos = poolInfoResults.map(poolInfo => ({
        assetType: poolInfo.info.assetType,
        startTime: poolInfo.info.startTime,
        lockTime: poolInfo.info.lockTime,
        endTime: poolInfo.info.endTime,
        status: poolInfo.info.status,
        targetPrice: poolInfo.info.targetPrice,
        optionATotal: poolInfo.info.optionATotal,
        optionBTotal: poolInfo.info.optionBTotal,
        title: poolInfo.info.title,
        optionA: poolInfo.info.optionA,
        optionB: poolInfo.info.optionB,
        isSettled: poolInfo.info.isSettled,
        winningOption: poolInfo.info.winningOption,
        createdAt: poolInfo.info.createdAt,
      }));
  
      setUserBetInfos(userBetInfos);      

      const newCache = { ...poolInfoCache };
      poolInfoResults.forEach(({pool_id, info}) => {
        if (Object.keys(info).length > 0) {
          newCache[pool_id] = info;
        }
      });
      
      setPoolInfoCache(newCache);
    } catch (error) {
      console.error("Error fetching pool info:", error);
    }
  }


  const formatAmount = (amount: string) => {
    // 假设代币有8位小数
    const decimal = 8;
    const value = parseFloat(amount) / Math.pow(10, decimal);
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  

  const formatOdds = (odds: string) => {
    const value = parseInt(odds) / 10000;
    return value.toString() + 'x';
  };
  
  const getOptionText = (poolId: string, option: number) => {
    const poolInfo = poolInfoCache[poolId];
    if (poolInfo) {
      return option === 1 ? poolInfo.optionA : poolInfo.optionB;
    }
    return option === 1 ? "YES" : "NO";
  };
  
  const getPoolTitle = (poolId: string) => {
    const poolInfo = poolInfoCache[poolId];
    return poolInfo?.title || `Pool #${poolId}`;
  };
  
  const isBetWinner = (poolId: string, option: number) => {
    const poolInfo = poolInfoCache[poolId];
    if (poolInfo?.isSettled) {
      return poolInfo.winningOption === option;
    }
    return null;
  };


  const getBetStatus = (poolId: string, option: number) => {
    const poolInfo = poolInfoCache[poolId];

    
    if (!poolInfo || poolInfo.status === undefined) {
      return { label: "Unknown", color: "default" };
    }
    
    if (poolInfo.status < 4) {
      return { 
        label: poolInfo.status === 1 ? "Active" : 
               poolInfo.status === 2 ? "Locked" : "Closed", 
        color: poolInfo.status === 1 ? "success" : 
               poolInfo.status === 2 ? "warning" : "info"
      };
    }
    
    if (poolInfo.isSettled) {
      const isWinner = poolInfo.winningOption === option;
      return { 
        label: isWinner ? "Won" : "Lost", 
        color: isWinner ? "success" : "error" 
      };
    }
    
    return { label: "Pending", color: "default" };
  };



  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleExpand}
      >
        <Typography variant="h6">
          Your Betting History
        </Typography>
        <IconButton>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {expanded && (
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={40} />
            </Box>
          ) : allHistoryInfos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
              You haven't placed any bets yet. Start predicting to see your history!
            </Typography>
          ) : isMobile ? (
            <Box>
              {allHistoryInfos.map((bet, index) => (
                <Paper 
                  key={`${bet.pool_id}-${index}`}
                  elevation={1} 
                  sx={{ p: 2, mb: 2, border: '1px solid rgba(0, 0, 0, 0.1)' }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {getPoolTitle(bet.pool_id)}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center">
                      {bet.option === 1 ? 
                        <TrendingUpIcon color="success" sx={{ mr: 0.5 }} /> : 
                        <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                      }
                      <Typography variant="body2">
                        {getOptionText(bet.pool_id, bet.option)}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      size="small"
                      label={getBetStatus(bet.pool_id, bet.option).label}
                      color={getBetStatus(bet.pool_id, bet.option).color as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Amount: <strong>{formatAmount(bet.amount)} AI.APT</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Odds: <strong>{formatOdds(bet.odds)}</strong>
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pool</TableCell>
                    <TableCell>Option</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Odds</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allHistoryInfos.map((bet, index) => (
                    <TableRow 
                      key={`${bet.pool_id}-${index}`}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontWeight={500}>
                          {getPoolTitle(bet.pool_id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {bet.option === 1 ? 
                            <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} /> : 
                            <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                          }
                          <Typography variant="body2">
                            {getOptionText(bet.pool_id, bet.option)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatAmount(bet.amount)} AIAPT
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatOdds(bet.odds)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small"
                          label={getBetStatus(bet.pool_id, bet.option).label}
                          color={getBetStatus(bet.pool_id, bet.option).color as any}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
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
