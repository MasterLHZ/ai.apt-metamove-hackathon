'use client';

import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import MessageIcon from '@mui/icons-material/Message';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MemoryIcon from '@mui/icons-material/Memory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { styled } from '@mui/material/styles';


const features = [
  {
    title: "Natural Language On-chain Interactions",
    description: "Interact with blockchain protocols using simple conversational language.",
    icon: <MessageIcon />,
    color: "linear-gradient(to right, #0E76FD, #00CED1)",
  },
  {
    title: "Dynamic DeFAI Applications",
    description: "Decentralized finance applications powered by advanced AI algorithms.",
    icon: <TrendingUpIcon />,
    color: "linear-gradient(to right, #8A2BE2, #00CED1)",
  },
  {
    title: "AI-Driven Influence Building",
    description: "Build and leverage influence across the crypto ecosystem with AI assistance.",
    icon: <PsychologyIcon />,
    color: "linear-gradient(to right, #0E76FD, #8A2BE2)",
  },
  {
    title: "Reinforcement Learning AI Engine",
    description: "Self-improving AI systems that adapt to market conditions and user behavior.",
    icon: <MemoryIcon />,
    color: "linear-gradient(to right, #00CED1, #0E76FD)",
  },
  {
    title: "Cognitive Mining System",
    description: "Earn rewards by contributing insights and predictions to the network.",
    icon: <MonetizationOnIcon />,
    color: "linear-gradient(to right, #8A2BE2, #0E76FD)",
  },
  {
    title: "Future Developments",
    description: "Cutting-edge features on our roadmap to revolutionize crypto AI.",
    icon: <AutoAwesomeIcon />,
    color: "linear-gradient(to right, #00CED1, #8A2BE2)",
    badge: "Coming Soon",
  },
];


const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};


const FeatureCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(14, 30, 51, 0.5)',
  border: '1px solid #1A2A3A',
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    borderColor: 'rgba(14, 118, 253, 0.5)',
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 30px rgba(14, 118, 253, 0.1)',
  },
}));

const IconWrapper = styled(Box)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  background: bgcolor,
  display: 'inline-flex',
  '& svg': {
    width: 24,
    height: 24,
    color: 'white',
  },
}));

const BadgeBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: 20,
  fontSize: '0.7rem',
  backgroundColor: 'rgba(138, 43, 226, 0.2)',
  color: '#8A2BE2',
  border: '1px solid rgba(138, 43, 226, 0.3)',
}));

export default function Features() {
  return (
    <Box component="section" id="features" sx={{ py: 10, bgcolor: '#0E1E33' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight="bold"
            sx={{
              mb: 2,
              backgroundImage: 'linear-gradient(to right, #0E76FD, #8A2BE2)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Core Features
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto' }}>
            Synaphex AI combines cutting-edge artificial intelligence with blockchain technology to create a powerful
            ecosystem of tools and services.
          </Typography>
        </Box>

        <Box
          component={motion.div}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Box
                  component={motion.div}
                  variants={item}
                  sx={{ height: '100%' }}
                >
                  <FeatureCard elevation={0} sx={{ height: '100%' }}>
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <IconWrapper bgcolor={feature.color}>
                          {feature.icon}
                        </IconWrapper>
                        
                        {feature.badge && (
                          <BadgeBox>
                            {feature.badge}
                          </BadgeBox>
                        )}
                      </Box>
                      
                      <Typography variant="h6" component="h3" color="white" fontWeight={500} sx={{ mb: 2 }}>
                        {feature.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </FeatureCard>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}