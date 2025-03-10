'use client';

import { Box, Container, Typography, Grid, Button, Paper, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import { ButtonProps } from '@mui/material';

const features = [
  "AI-powered prediction markets",
  "Natural language query interface",
  "Real-time market analytics",
  "Cross-chain compatibility",
  "Automated strategy execution",
  "Community-driven insights",
];

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(14, 30, 51, 0.9)',
  border: '1px solid rgba(14, 118, 253, 0.3)',
  borderRadius: theme.spacing(1),
  boxShadow: '0 10px 30px rgba(138, 43, 226, 0.1)',
  padding: theme.spacing(3),
}));

interface MarketButtonProps extends Omit<ButtonProps, 'color'> {
  colorType: 'green' | 'red';
}

const MarketButton: React.FC<MarketButtonProps> = ({ colorType, children, ...props }) => {
  const buttonStyles = {
    borderColor: colorType === 'green' ? '#4CAF50' : '#f44336',
    color: colorType === 'green' ? '#4CAF50' : '#f44336',
    '&:hover': {
      backgroundColor: colorType === 'green' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
      borderColor: colorType === 'green' ? '#4CAF50' : '#f44336',
    },
  };

  return (
    <Button variant="outlined" sx={buttonStyles} {...props}>
      {children}
    </Button>
  );
};



const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

const CheckIconWrapper = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(1.5),
  marginTop: 2,
  background: 'linear-gradient(to right, #0E76FD, #8A2BE2)',
  borderRadius: '50%',
  padding: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    width: 16,
    height: 16,
    color: 'white',
  },
}));

export default function AiptPlatform() {
  return (
    <Box component="section" id="aipt" sx={{ py: 10, bgcolor: 'rgba(14, 30, 51, 0.7)' }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} lg={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: '400px', md: '500px' },
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(14, 118, 253, 0.3)',
                  boxShadow: '0 20px 40px rgba(138, 43, 226, 0.1)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom right, #0E1E33, rgba(14, 30, 51, 0.8))',
                    zIndex: 1,
                  }}
                />

                {/* Platform visualization */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    p: 2,
                  }}
                >
                  <StyledPaper elevation={0}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                        AI.APT Prediction Market
                      </Typography>
                      <Box
                        sx={{
                          height: 4,
                          width: 80,
                          background: 'linear-gradient(to right, #0E76FD, #8A2BE2)',
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#0E1E33',
                          border: '1px solid #1A2A3A',
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Will ETH price exceed $3,000 by end of month?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <MarketButton size="small" colorType="green">
                              Yes (67%)
                            </MarketButton>
                            <MarketButton size="small" colorType="red">
                              No (33%)
                            </MarketButton>
                          </Box>
                          <Typography variant="caption" color="text.disabled">
                            $24,560 pool
                          </Typography>
                        </Box>
                      </Paper>

                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#0E1E33',
                          border: '1px solid #1A2A3A',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Will Aptos TVL grow by 25% in Q3?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <MarketButton size="small" colorType="green">
                              Yes (82%)
                            </MarketButton>
                            <MarketButton size="small" colorType="red">
                              No (18%)
                            </MarketButton>
                          </Box>
                          <Typography variant="caption" color="text.disabled">
                            $18,340 pool
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 120,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to right, rgba(14, 118, 253, 0.2), rgba(138, 43, 226, 0.2))',
                            borderRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 60,
                            background: 'linear-gradient(to top, rgba(14, 118, 253, 0.3), transparent)',
                            borderBottomLeftRadius: 1,
                            borderBottomRightRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            AI-generated market insights
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Click to expand
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </StyledPaper>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
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
                AI.APT Platform
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Our flagship AI.APT platform combines predictive intelligence with decentralized markets, enabling users
                to leverage AI insights for better decision-making in the crypto space.
              </Typography>

              <Box sx={{ mb: 4 }}>
                {features.map((feature, index) => (
                  <FeatureItem key={index}>
                    <CheckIconWrapper>
                      <CheckIcon />
                    </CheckIconWrapper>
                    <Typography variant="body1" color="text.secondary">
                      {feature}
                    </Typography>
                  </FeatureItem>
                ))}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    background: 'linear-gradient(to right, #0E76FD, #8A2BE2)',
                    '&:hover': { opacity: 0.9 },
                    px: 4,
                  }}
                >
                  Try Demo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: '#00CED1',
                    color: '#00CED1',
                    '&:hover': {
                      borderColor: '#00CED1',
                      backgroundColor: 'rgba(0, 206, 209, 0.1)',
                    },
                    px: 4,
                  }}
                >
                  Watch Video
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
