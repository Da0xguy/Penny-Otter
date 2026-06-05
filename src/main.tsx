import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import SUI dApp Kit configurations, providers & STYLES
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl, JsonRpcHTTPTransport } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// Configure network connections with modern SUI 2.0 transports & network variables
const { networkConfig } = createNetworkConfig({
  localnet: { 
    network: 'localnet',
    transport: new JsonRpcHTTPTransport({ url: getJsonRpcFullnodeUrl('localnet') }) 
  },
  mainnet: { 
    network: 'mainnet',
    transport: new JsonRpcHTTPTransport({ url: getJsonRpcFullnodeUrl('mainnet') }) 
  },
});

// Setup Query Client for state cache management
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="localnet">
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
