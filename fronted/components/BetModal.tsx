"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Chip,
  InputAdornment,
  CircularProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const formatUTCDate = (dateString: string) => {
  return dateString;
};

// Types
export type BetOption = {
  id: string;
  text: string;
  odds: number;
};

export type Topic = {
  id: string;
  status: "live" | "next" | "expired" | "later";
  question: string;
  settlementTime: string;
  options: BetOption[];
  prizePool: number;
};

export type BetModalProps = {
  open: boolean;
  topic: Topic;
  option: BetOption;
  userPoints: number;
  onClose: () => void;
  onPlaceBet: (amount: number, calculatedOdds: number) => void;
};

// Styled components
const OptionBoxUp = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.grey[800],
  border: `1px solid ${theme.palette.success.main}`,
  marginBottom: theme.spacing(2)
}));

const OptionBoxDown = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.grey[800],
  border: `1px solid ${theme.palette.error.main}`,
  marginBottom: theme.spacing(2)
}));

const ChipUp = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  fontSize: '0.75rem'
}));

const ChipDown = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  fontSize: '0.75rem'
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    maxWidth: '450px',
    width: '100%',
    borderRadius: theme.shape.borderRadius * 2
  }
}));

export default function BetModal({ open, topic, option, userPoints, onClose, onPlaceBet }: BetModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [calculatedOdds, setCalculatedOdds] = useState<number>(option.odds);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [potentialWin, setPotentialWin] = useState<number>(0);
  const isOptionUp = option.id === "a";

  // Reset state when modal opens with new option
  useEffect(() => {
    if (open) {
      setAmount("");
      setCalculatedOdds(option.odds);
      setPotentialWin(0);
    }
  }, [open, option.odds]);

  // Calculate potential win when amount or odds change
  useEffect(() => {
    const numAmount = Number.parseFloat(amount) || 0;
    const potentialwinnumber = numAmount * calculatedOdds;
    const factor = 10_000;
    const truncatedNumber = Math.floor(potentialwinnumber * factor) / factor;
    setPotentialWin(truncatedNumber);
  }, [amount, calculatedOdds]);

  // Simulate odds calculation (in a real app, this would be a backend call)
  useEffect(() => {
    if (amount && Number.parseFloat(amount) > 0) {
      setIsCalculating(true);
      let isOptionUptotal = isOptionUp ? 10000 + Number.parseFloat(amount) : 10000;
      let isOptionDowntotal = isOptionUp ? 10000 : 10000 + Number.parseFloat(amount);
      const timer = setTimeout(() => {
        let newOdds = 0;
        if (isOptionUp) {
          const variation = isOptionDowntotal / isOptionUptotal
          newOdds = variation;
        } else {
          const variation = isOptionUptotal / isOptionDowntotal
          newOdds = variation;
        }
        const newOddsnumber = 1 + Number.parseFloat(newOdds.toString())
        const factor = 10_000; // 10^4,
        const truncatedNumber = Math.floor(newOddsnumber * factor) / factor;
        setCalculatedOdds(truncatedNumber);
        setIsCalculating(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [amount, option.odds]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = () => {
    const numAmount = Number.parseFloat(amount);
    if (numAmount > 0 && numAmount <= userPoints) {
      onPlaceBet(numAmount, calculatedOdds);
    }
  };


  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      aria-labelledby="bet-modal-title"
      fullWidth
    >
      <DialogTitle 
        id="bet-modal-title" 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'grey.700',
          pb: 2
        }}
      >
        <Typography variant="h6" fontWeight="bold" component="span">
          Place Bet
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{ color: 'grey.500', '&:hover': { color: 'common.white' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" fontWeight="medium" sx={{ mb: 1, mt: '20px' }}>
            {topic.question}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.400' }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              Settlement: {formatUTCDate(topic.settlementTime)}
            </Typography>
          </Box>
        </Box>

        {isOptionUp ? (
          <OptionBoxUp elevation={0} sx={{ border: '1px solid rgb(28, 172, 149)', }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1,  }}>
              <ChipUp label="UP" size="small" sx={{ bgcolor: 'rgb(28, 172, 149)' }}/>
              <Typography 
                variant="body2" 
                color='rgb(28, 172, 149)' 
                fontWeight="medium"
                component="span"
              >
                {isCalculating ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Calculating... 
                    <CircularProgress size={14} color="inherit" sx={{ ml: 1 }} />
                  </Box>
                ) : (
                  `${calculatedOdds}x Payout`
                )}
              </Typography>
            </Box>
            <Typography variant="body1" color="common.white">
              {option.text}
            </Typography>
          </OptionBoxUp>
        ) : (
          <OptionBoxDown elevation={0} sx={{ border: '1px solid rgb(228, 43, 135)', }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, }}>
              <ChipDown label="DOWN" size="small" sx={{ bgcolor: 'rgb(228, 43, 135)'}}/>
              <Typography 
                variant="body2" 
                color='rgb(228, 43, 135)' 
                fontWeight="medium"
                component="span"
              >
                {isCalculating ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Calculating... 
                    <CircularProgress size={14} color="inherit" sx={{ ml: 1 }} />
                  </Box>
                ) : (
                  `${calculatedOdds}x Payout`
                )}
              </Typography>
            </Box>
            <Typography variant="body1" color="common.white">
              {option.text}
            </Typography>
          </OptionBoxDown>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            color="grey.300" 
            fontWeight="medium" 
            sx={{ mb: 1 }}
            component="span"
          >
            Bet Amount (Available: {userPoints} AI.APT)
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    size="small"
                    variant="contained"
                    color="inherit"
                    sx={{ 
                      backgroundColor: 'grey.700',
                      color: 'common.white',
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: 'grey.600'
                      }
                    }}
                    onClick={() => setAmount(userPoints.toString())}
                  >
                    MAX
                  </Button>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'grey.800',
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main'
                },
                '& fieldset': {
                  borderColor: 'grey.700'
                }
              },
              '& .MuiInputBase-input': {
                color: 'common.white'
              }
            }}
          />
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            backgroundColor: 'grey.800',
            borderRadius: 1,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="grey.300">
              Potential Win:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {potentialWin} AI.APT
            </Typography>
          </Box>
        </Paper>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !amount || 
            Number.parseFloat(amount) <= 0 || 
            Number.parseFloat(amount) > userPoints || 
            isCalculating
          }
          sx={{
            py: 1.5,
            fontWeight: 'medium',
            borderRadius: 1,
            backgroundColor: isOptionUp ? 'rgb(28, 172, 149)' : 'rgb(228, 43, 135)',
            '&:hover': {
              backgroundColor: isOptionUp ? 'rgb(28, 172, 149)' : 'rgb(228, 43, 135)'
            },
            '&.Mui-disabled': {
              backgroundColor: 'grey.700'
            }
          }}
        >
          Confirm Bet
        </Button>
      </DialogContent>
    </StyledDialog>
  );
}
