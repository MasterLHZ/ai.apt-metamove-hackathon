import Image from "next/image";
import { Box, Typography, Grid, Card } from "@mui/material";
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import Link from '@mui/material/Link';


export default function UserGuide() {
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
    const [connectedAddress, setConnectedAddress] = useState('')

    useEffect(() => {
        if (connected) {
            setConnectedAddress(account.address.toString())
        } else {
            setConnectedAddress('')
        }
    }, [connected, account]);

  return (
    <Box sx={{ bgcolor: 'rgb(42, 49, 63)', borderRadius: 2, p: 3, mt: '70px' }}>
      <Box textAlign="center" mb={3}>
        <Typography variant="h6" color="grey.100">
          We're in the testnet phase. Follow the steps below to claim test tokens.
        </Typography>
        <Typography variant="h6" color="grey.100">
          1.Switch to testnet.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {[1, 2, 3].map((index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                position: "relative",
                bgcolor: "grey.700",
                borderRadius: 2,
                overflow: "hidden",
                aspectRatio: "1 / 1",
              }}
            >
              <Image
                src={`/guide${index}.jpg?height=300&width=300&text=Guide ${index}`}
                alt={`Guide step ${index}`}
                fill
                style={{ objectFit: "cover" }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box textAlign="center" mt={2}>
        {connectedAddress !== '' ? 
        <>
            <Typography variant="h6" color="grey.100">
                2.Claim test tokens from faucet. 
            </Typography>
            <Link 
                href={`https://aptos.dev/en/network/faucet?address=${connectedAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                color="inherit"
                sx={{ textDecoration: 'underline' }}
            >
                https://aptos.dev/en/network/faucet?address={connectedAddress}
            </Link>
        </>
         :
        <>
            <Typography variant="h6" color="grey.100">
                2.Claim test tokens from faucet. 
            </Typography>
        </>
        }
      </Box>
    </Box>
  );
}

