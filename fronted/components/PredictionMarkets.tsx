import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function PredictionMarkets() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
        Synaphex AI
      </Typography>
      <Tooltip title="Make predictions about future events and earn rewards!">
        <IconButton size="small" sx={{ ml: 1 }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
