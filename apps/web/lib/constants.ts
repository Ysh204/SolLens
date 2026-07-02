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
  { id: "pda-generator", label: "PDA Generator", icon: "key" },
  { id: "spl-token", label: "ATA Generator", icon: "coin" },
  { id: "data-decoder", label: "Data Playground", icon: "code" },
  { id: "address-lookup", label: "Address Lookup", icon: "search" },
  { id: "tx-inspector", label: "Tx Inspector", icon: "activity" },
  { id: "account-explorer", label: "Account Explorer", icon: "database" },
  { id: "cli-generator", label: "CLI Generator", icon: "cli" },
];

export const LIVE_TOOL_ITEMS: ToolItem[] = [
  {
    id: "pda-generator",
    title: "PDA Generator",
    description: "Derive program addresses with seeds",
    icon: "key",
  },
  {
    id: "spl-token",
    title: "ATA Generator",
    description: "Associated token address for wallet + mint",
    icon: "coin",
  },
  {
    id: "data-decoder",
    title: "Data Playground",
    description: "Account, instruction, tx & event decoders",
    icon: "code",
  },
];

export const TOOL_ITEMS: ToolItem[] = LIVE_TOOL_ITEMS;

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
  "cli-generator": "CLI Generator",
};

export const GITHUB_URL = "https://github.com/Ysh204/SolLens";
export const DOCS_URL = "https://github.com/Ysh204/SolLens#readme";
export const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
