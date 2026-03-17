"use client";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  Theme,
} from "@rainbow-me/rainbowkit";
import { config } from "../../lib/config";
import merge from "lodash/merge";

const queryClient = new QueryClient();

const aotTheme = merge(darkTheme(), {
  colors: {
    accentColor: "#f0a500",
    accentColorForeground: "#060608",
    actionButtonBorder: "#2a2a3a",
    actionButtonBorderMobile: "#2a2a3a",
    actionButtonSecondaryBackground: "#0e0e14",
    closeButton: "#6e6a5e",
    closeButtonBackground: "#0e0e14",
    connectButtonBackground: "#0a0a0e",
    connectButtonBackgroundError: "#ff2d7a",
    connectButtonInnerBackground: "#060608",
    connectButtonText: "#f0a500",
    connectButtonTextError: "#ff2d7a",
    connectionIndicator: "#00f5a0",
    downloadBottomCardBackground: "#0a0a0e",
    downloadTopCardBackground: "#060608",
    error: "#ff2d7a",
    generalBorder: "#2a2a3a",
    generalBorderDim: "#1c1c28",
    menuItemBackground: "#0e0e14",
    modalBackdrop: "rgba(0, 0, 0, 0.85)",
    modalBackground: "#0a0a0e",
    modalBorder: "#2a2a3a",
    modalText: "#d4cfc4",
    modalTextDim: "#6e6a5e",
    modalTextSecondary: "#6e6a5e",
    profileAction: "#0e0e14",
    profileActionHover: "#13131e",
    profileForeground: "#0a0a0e",
    selectedOptionBorder: "#f0a500",
    standby: "#f0a500",
  },
  fonts: {
    body: "'Barlow Condensed', sans-serif",
  },
  radii: {
    actionButton: "0px",
    connectButton: "0px",
    menuButton: "0px",
    modal: "0px",
    modalMobile: "0px",
  },
  shadows: {
    connectButton: "0 0 20px #f0a50020",
    dialog: "0 0 40px #00000080",
    profileDetailsAction: "none",
    selectedOption: "0 0 10px #f0a50030",
    selectedWallet: "0 0 10px #f0a50030",
    walletLogo: "none",
  },
} as Theme);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={aotTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
