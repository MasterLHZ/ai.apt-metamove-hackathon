'use client';

import { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { WalletConnector as MuiWalletSelector } from "@aptos-labs/wallet-adapter-mui-design";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Utils } from "aptos-tool";
import { Copy, LogOut } from "lucide-react";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { WalletSelector } from './wallet/WalletSelector';
import { ThemeToggle } from './ThemeToggle';
import LoginModal from './LoginModal';
import { shortenAddress } from '@/utils/util';
import { getAptosAccount } from '@/utils/place-order';
import WalletConnector from './WalletConnector';


const navItems = [
  { title: 'Features', href: '#features' },
  { title: 'AI.APT', href: '#aipt' },
  { title: 'Community', href: '#community' },
];
const accountPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;


export default function AIAPTHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // const { account, disconnect, connect, wallets } = useWallet();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0xe9cc5dc0fc8c7300c02f627f32ac10772d08bd4effdea773ec784fd9c02a7298");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      setIsLoggedIn(!!user);
      setWalletAddress(shortenAddress(user || "0xe9cc5dc0fc8c7300c02f627f32ac10772d08bd4effdea773ec784fd9c02a7298") || "");
    }
  }, []);


  const handleLogin = (method: string) => {
    const account = getAptosAccount(accountPrivateKey);
    let walletAccount = '';
    if (account.accountAddress.toString()) {
      walletAccount = account.accountAddress.toString();
    } else {
      walletAccount = "0xe9cc5dc0fc8c7300c02f627f32ac10772d08bd4effdea773ec784fd9c02a7298";
    }
    setIsLoggedIn(true);
    setWalletAddress(shortenAddress(walletAccount));
    setIsLoginModalOpen(false);
    localStorage.setItem("user", walletAccount);
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };
  
  return (
    <AppBar 
      position="fixed" 
      sx={{
        backgroundColor: scrolled ? 'rgba(14, 30, 51, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 1100,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
                mr: 2,
                fontWeight: 700,
                background: 'linear-gradient(90deg, #0E76FD 0%, #8A2BE2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
            }}
          >
            Synaphex AI
          </Typography>

          {!isMobile ? (
            <>
              <div className="flex flex-col gap-4 items-center">
                <MuiWalletSelector />
              </div>
            </>
          ) : (
            <>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => toggleDrawer(false)}
                PaperProps={{
                  sx: {
                    width: '70%',
                    backgroundColor: '#0E1E33',
                    backgroundImage: 'linear-gradient(rgba(14, 30, 51, 0.95), rgba(14, 30, 51, 0.98))',
                  }
                }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => toggleDrawer(false)}>
                    <CloseIcon sx={{ color: 'white' }} />
                  </IconButton>
                </Box>
              </Drawer>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
