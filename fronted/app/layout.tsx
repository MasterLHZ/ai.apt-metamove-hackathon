'use client';
import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme/theme';
import { Toaster } from "../components/ui/toaster";
import { WalletProvider } from '@/components/providers/WalletProvider';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import type { AppProps } from 'next/app';


const wallets = [
  new PetraWallet(),
];


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Synaphex AI | Crypto AI Agent</title>
        <meta name="description" content="Synaphex AI is a cutting-edge crypto AI agent platform built on Aptos blockchain, revolutionizing on-chain interactions with advanced AI technology." />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>
      <WalletProvider>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
            <Toaster />
        </ThemeProvider>
      </WalletProvider>
      </body>
    </html>
  );
}
