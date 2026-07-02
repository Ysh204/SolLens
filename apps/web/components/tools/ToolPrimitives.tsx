"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "../icons";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="copy-btn" onClick={handleCopy} title={label}>
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

interface ResultFieldProps {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  highlight?: boolean;
}

export function ResultField({ label, value, mono = true, copyable = true, highlight }: ResultFieldProps) {
  return (
    <div className={`result-field ${highlight ? "result-field--highlight" : ""}`}>
      <div className="result-field-header">
        <span className="result-field-label">{label}</span>
        {copyable && <CopyButton value={value} />}
      </div>
      <div className={`result-field-value ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

interface ToolPanelProps {
  moduleTag: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolPanel({ moduleTag, title, description, children }: ToolPanelProps) {
  return (
    <div className="tool-panel">
      <div className="tool-panel-chrome">
        <div className="terminal-chrome-left">
          <span className="terminal-prompt-label">sollens@tools:~</span>
          <span className="terminal-module-tag">{moduleTag}</span>
        </div>
      </div>
      <div className="tool-panel-header">
        <h2 className="tool-panel-title">{title}</h2>
        <p className="tool-panel-desc">{description}</p>
      </div>
      <div className="tool-panel-body">{children}</div>
    </div>
  );
}

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ToolSection({ title, children }: ToolSectionProps) {
  return (
    <section className="tool-section">
      <h3 className="tool-section-title">{title}</h3>
      {children}
    </section>
  );
}

interface ToolTextareaProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}

export function ToolTextarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = true,
}: ToolTextareaProps) {
  return (
    <label className="tool-field">
      <span className="tool-field-label">{label}</span>
      {hint && <span className="tool-field-hint">{hint}</span>}
      <textarea
        className={`tool-textarea ${mono ? "mono" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
      />
    </label>
  );
}

interface ToolInputProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function ToolInput({ label, hint, value, onChange, placeholder }: ToolInputProps) {
  return (
    <label className="tool-field">
      <span className="tool-field-label">{label}</span>
      {hint && <span className="tool-field-hint">{hint}</span>}
      <input
        className="tool-input mono"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </label>
  );
}

interface DecodeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export function DecodeButton({ onClick, disabled, loading, label = "Decode" }: DecodeButtonProps) {
  return (
    <button
      type="button"
      className="tool-decode-btn"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Decoding…" : label}
    </button>
  );
}

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return <div className="tool-error">{message}</div>;
}

interface TabBarProps<T extends string> {
  tabs: Array<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div className="tool-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tool-tab ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
