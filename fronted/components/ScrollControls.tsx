import { IconButton, Box } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ScrollControlsProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export default function ScrollControls({ onScrollLeft, onScrollRight }: ScrollControlsProps) {
  return (
    <>
      <Box sx={{ 
        position: 'absolute', 
        left: 0, 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 2,
      }}>
        <IconButton 
          onClick={onScrollLeft}
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.5)', 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        position: 'absolute', 
        right: 0, 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 2,
      }}>
        <IconButton 
          onClick={onScrollRight}
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.5)', 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </>
  );
}