"use client"

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { motion } from 'framer-motion';
import ParticleNetwork from './ParticleNetwork';
// import { useRouter } from 'next/router';
import { useRouter } from 'next/navigation';


export default function Hero() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const router = useRouter();


  useEffect(() => {
    const handleScroll = () => {
      const newOpacity = 1 - Math.min(1, window.scrollY / 300);
      setScrollOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleJump = () => {
    router.push('/AIAPT');
  };



  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <ParticleNetwork />

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(14, 30, 51, 0.3), rgba(14, 30, 51, 0.8))',
          zIndex: 1,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              backgroundImage: 'linear-gradient(90deg, #0E76FD, #8A2BE2, #00CED1)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              maxWidth: '80%',
              mx: 'auto',
            }}
          >
            Synaphex AI: Building the World's BEST Crypto AI Agent
          </Typography>

          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{ mb: 5, maxWidth: '700px', mx: 'auto' }}
          >
            Revolutionizing on-chain interactions with advanced AI technology on the Aptos blockchain.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              background: 'linear-gradient(90deg, #0E76FD 0%, #8A2BE2 100%)',
            }}
            onClick={handleJump}
          >
            Explore AI.APT
          </Button>
        </motion.div>
      </Container>

      <Box
        sx={{
          position: 'absolute',
          bottom: theme.spacing(4),
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          opacity: scrollOpacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 40, color: 'white', opacity: 0.7 }} />
        </motion.div>
      </Box>
    </Box>
  );
}
