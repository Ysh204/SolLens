export type ModuleId =
  | "terminal"
  | "address-lookup"
  | "tx-inspector"
  | "account-explorer"
  | "spl-token"
  | "pda-generator"
  | "data-decoder"
  | "cli-generator";

export type IconName =
  | "terminal"
  | "search"
  | "activity"
  | "database"
  | "coin"
  | "key"
  | "code"
  | "cli";

export interface Span {
  start: number;
  end: number;
}

export interface Diagnostic {
  severity: "Error" | "Warning";
  message: string;
  span: Span;
  help?: string;
}

export interface SuccessValue {
  type: string;
  value: unknown;
}

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system" | "info";
  content: string;
}
