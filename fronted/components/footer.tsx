'use client';

import { Box, Container, Grid, Typography, Link, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';



const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "AI.APT Platform", href: "#aipt" },
      { name: "Cognitive Mining", href: "#mining" },
      { name: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "#" },
      { name: "Whitepaper", href: "#" },
      { name: "API", href: "#" },
      { name: "GitHub", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  },
];


const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  '&:hover': {
    color: '#0E76FD',
  },
  display: 'inline-block',
  marginBottom: theme.spacing(1),
}));

const FooterHeading = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 500,
  marginBottom: theme.spacing(2),
}));

const LogoTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  backgroundImage: 'linear-gradient(to right, #0E76FD, #8A2BE2)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'inline-block',
  marginBottom: theme.spacing(2),
}));

const AptosBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& img': {
    marginRight: theme.spacing(1),
  },
}));

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'rgba(14, 30, 51, 0.9)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <LogoTypography variant="h5">
              Synaphex AI
            </LogoTypography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Building the world's best crypto AI agent platform on Aptos blockchain, empowering users with intelligent
              tools for better decision-making.
            </Typography>
            
            <AptosBadge>
              <Box
                sx={{
                  bgcolor: 'rgba(14, 118, 253, 0.2)',
                  p: 0.5,
                  borderRadius: 1,
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ width: '24px', height: '24px' }}>
                  <Image
                    src="/aptos-logo.svg"
                    alt="AptosLogoRef"
                    width={24}
                    height={24}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Powered by Aptos
              </Typography>
            </AptosBadge>
          </Grid>
          
          {footerLinks.map((section, index) => (
            <Grid item xs={6} sm={3} md={2} key={index}>
              <FooterHeading variant="subtitle1">
                {section.title}
              </FooterHeading>
              
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                {section.links.map((link, linkIndex) => (
                  <Box component="li" key={linkIndex}>
                    <FooterLink href={link.href}>
                      {link.name}
                    </FooterLink>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 6,
            pt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'center' },
          }}
        >
          <Typography variant="body2" color="text.disabled" sx={{ mb: { xs: 2, md: 0 } }}>
            © {currentYear} Synaphex AI. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="text"
              color="inherit"
              size="small"
              sx={{ color: 'text.disabled', '&:hover': { color: 'white' } }}
            >
              English
            </Button>
            
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
