import type { IconName, ModuleId } from "./types";

export interface NavItem {
  id: ModuleId;
  label: string;
  icon: IconName;
}

export interface ToolItem {
  id: ModuleId;
  title: string;
  description: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "terminal", label: "Expression Engine", icon: "terminal" },
  { id: "address-lookup", label: "Address Lookup", icon: "search" },
  { id: "tx-inspector", label: "Tx Inspector", icon: "activity" },
  { id: "account-explorer", label: "Account Explorer", icon: "database" },
  { id: "spl-token", label: "SPL Token Tools", icon: "coin" },
  { id: "pda-generator", label: "PDA Generator", icon: "key" },
  { id: "data-decoder", label: "Data Decoder", icon: "code" },
  { id: "cli-generator", label: "CLI Generator", icon: "cli" },
];

export const TOOL_ITEMS: ToolItem[] = [
  {
    id: "address-lookup",
    title: "Address Lookup",
    description: "Look up any Solana address",
    icon: "search",
  },
  {
    id: "tx-inspector",
    title: "Transaction Inspector",
    description: "Decode and analyze transactions",
    icon: "activity",
  },
  {
    id: "account-explorer",
    title: "Account Explorer",
    description: "Explore account data and layout",
    icon: "database",
  },
  {
    id: "spl-token",
    title: "SPL Token Tools",
    description: "Mint, ATA, and token utilities",
    icon: "coin",
  },
  {
    id: "pda-generator",
    title: "PDA Generator",
    description: "Derive program addresses with seeds",
    icon: "key",
  },
  {
    id: "data-decoder",
    title: "Data Decoder",
    description: "Decode Borsh, Anchor, and raw bytes",
    icon: "code",
  },
];

export const ASCII_LOGO = `
 ███████╗ ██████╗ ██╗     ██╗     ███████╗███╗   ██╗███████╗
 ██╔════╝██╔═══██╗██║     ██║     ██╔════╝████╗  ██║██╔════╝
 ███████╗██║   ██║██║     ██║     █████╗  ██╔██╗ ██║███████╗
 ╚════██║██║   ██║██║     ██║     ██╔══╝  ██║╚██╗██║╚════██║
 ███████║╚██████╔╝███████╗███████╗███████╗██║ ╚████║███████║
 ╚══════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
`.trim();

export const COMING_SOON_MODULES: Record<string, string> = {
  "address-lookup": "Address Lookup",
  "tx-inspector": "Transaction Inspector",
  "account-explorer": "Account Explorer",
  "spl-token": "SPL Token Tools",
  "pda-generator": "PDA Generator",
  "data-decoder": "Data Decoder",
  "cli-generator": "CLI Generator",
};

export const GITHUB_URL = "https://github.com/Ysh204/SolLens";
export const DOCS_URL = "https://github.com/Ysh204/SolLens#readme";
export const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
