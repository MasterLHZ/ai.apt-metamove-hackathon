'use client';

import Navbar from '@/components/navbar';
import Hero from '@/components/hero';
import Features from '@/components/features';
import AiptPlatform from '@/components/aipt-platform';
import Footer from '@/components/footer';
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
import ParticleNetwork from '../components/ParticleNetwork';
import { useRouter } from 'next/navigation';


export default function Home() {
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
    router.replace('/AIAPT');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0E1E33 0%, rgba(14, 30, 51, 0.95) 100%)',
      color: 'white',
      overflowX: 'hidden',
      overflowY: 'hidden'
    }}>
      <Navbar />
      <Hero />
      <Features />
      <AiptPlatform />
      <Footer />
    </Box>
  );
}
