import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Typography, 
  Menu, 
  MenuItem, 
  Box, 
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert 
} from '@mui/material';
import { useWallet, WalletReadyState } from '@aptos-labs/wallet-adapter-react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';

// Styled components
const WalletButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: theme.shadows[2],
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const AddressBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  borderRadius: '8px',
  padding: '6px 12px',
  maxWidth: '140px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
  },
}));

const WalletConnector: React.FC = () => {
  const { 
    connect, 
    account, 
    disconnect, 
    connected, 
    wallet, 
    wallets 
  } = useWallet();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [connecting, setConnecting] = useState(false)
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const [petraDetected, setPetraDetected] = useState(false);


  const isPetraInstalled = () => {
    return wallets.some(
      wallet => wallet.name === 'Petra' && wallet.readyState === WalletReadyState.Installed
    );
  };

  const handleConnectClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isPetraInstalled()) {
      handleConnectPetra();
    } else {
      setConnecting(false)
      setAnchorEl(event.currentTarget);
    }
  };

  const handleConnectPetra = async () => {
    try {
      setConnecting(true)
      const petraWallet = wallets.find(wallet => wallet.name === 'Petra');
      if (petraWallet) {
        await connect(petraWallet.name);
        setSnackbarMessage('Wallet connected successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setConnecting(false)
      console.error('Failed to connect to Petra wallet:', error);
      setSnackbarMessage('Failed to connect wallet. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSnackbarMessage('Wallet disconnected');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setSnackbarMessage('Failed to disconnect wallet');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString())
        .then(() => {
          setSnackbarMessage('Address copied to clipboard');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        })
        .catch((error) => {
          console.error('Failed to copy address:', error);
          setSnackbarMessage('Failed to copy address');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPetraInstallationUrl = () => {
    return 'https://petra.app/';
  };

    useEffect(() => {
      wallets.forEach(w => {
        console.log(`Wallet: ${w.name}, Ready State: ${w.readyState}`);
      });
  
      const ready = wallets.filter(w => 
        w.readyState === WalletReadyState.Installed
      );
      setAvailableWallets(ready);
  
      const petra = wallets.find(w => w.name === 'Petra');
      if (petra) {
        setPetraDetected(true);
      } else {
        setPetraDetected(false);
      }
    }, [wallets]);
  
    useEffect(() => {
      if (connected && account) {
        showSnackbar('Wallet connected successfully', 'success');
      }
    }, [connected, account]);
  
    const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    };

  return (
    <>
      {!connected ? (
        <>
          <WalletButton
            variant="contained"
            color="primary"
            onClick={handleConnectClick}
            startIcon={<AccountBalanceWalletIcon />}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </WalletButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            sx={{ mt: 1 }}
          >
            {isPetraInstalled() ? (
              <MenuItem onClick={handleConnectPetra}>
                <Box display="flex" alignItems="center">
                  <img 
                    src="https://petra.app/favicon.ico" 
                    alt="Petra Wallet" 
                    width={24} 
                    height={24}
                    style={{ marginRight: 8 }} 
                  />
                  Connect Petra Wallet
                </Box>
              </MenuItem>
            ) : (
              <MenuItem 
                onClick={() => {
                  window.open(getPetraInstallationUrl(), '_blank');
                  handleClose();
                }}
              >
                <Box display="flex" alignItems="center" flexDirection="column">
                  <Typography variant="body1" sx={{ mb: 1 }}>Petra Wallet not installed</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="primary"
                  >
                    Install Petra
                  </Button>
                </Box>
              </MenuItem>
            )}
          </Menu>
        </>
      ) : (
        <Box display="flex" alignItems="center">
          <Tooltip
            title={
              <Box>
                <Typography variant="body2">
                  {account?.address?.toString()}
                </Typography>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  mt={1}
                >
                  <Button 
                    size="small" 
                    startIcon={<ContentCopyIcon fontSize="small" />}
                    onClick={handleCopyAddress}
                    sx={{ mr: 1 }}
                  >
                    Copy
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    startIcon={<LogoutIcon fontSize="small" />}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </Box>
              </Box>
            }
            open={tooltipOpen}
            onOpen={() => setTooltipOpen(true)}
            onClose={() => setTooltipOpen(false)}
            arrow
            placement="bottom-end"
            sx={{ maxWidth: 'none' }}
          >
            <AddressBox 
              onClick={() => setTooltipOpen(!tooltipOpen)}
            >
              {wallet?.icon && (
                <img 
                  src={wallet.icon} 
                  alt={`${wallet.name} icon`}
                  width={20}
                  height={20}
                  style={{ marginRight: 8 }}
                />
              )}
              <Typography 
                variant="body2" 
                noWrap 
                fontWeight={600}
                fontSize="0.875rem"
              >
                {shortenAddress(account?.address?.toString() || '')}
              </Typography>
            </AddressBox>
          </Tooltip>
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
    </>
  );
};

export default WalletConnector;
