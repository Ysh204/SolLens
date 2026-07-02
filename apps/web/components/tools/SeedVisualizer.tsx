"use client";

import type { ParsedSeed } from "../../lib/solana/pda";
import { buildSeedChain, formatSeedBytes } from "../../lib/solana/pda";
import { bytesToHex } from "../../lib/solana/bytes";

interface SeedVisualizerProps {
  seeds: ParsedSeed[];
  programId: string;
  pda: string;
  bump: number;
  pdaBytes: Uint8Array;
}

export function SeedVisualizer({ seeds, programId, pda, bump, pdaBytes }: SeedVisualizerProps) {
  const chain = buildSeedChain(seeds, programId, pda, bump);

  return (
    <div className="seed-visualizer">
      <div className="seed-visualizer-header">
        <span className="seed-visualizer-title">Seed Chain</span>
        <span className="seed-visualizer-sub">program + seeds → canonical bump → PDA</span>
      </div>

      <div className="seed-chain">
        {chain.map((node, i) => (
          <div key={node.id} className="seed-chain-item">
            {i > 0 && <div className="seed-chain-arrow" aria-hidden>↓</div>}
            <div className={`seed-node seed-node--${node.type}`}>
              <div className="seed-node-top">
                <span className="seed-node-title">{node.title}</span>
                <span className="seed-node-badge">{node.byteLength} B</span>
              </div>
              <span className="seed-node-subtitle">{node.subtitle}</span>
              <code className="seed-node-detail">{node.detail}</code>
            </div>
          </div>
        ))}
      </div>

      <div className="seed-bytes-grid">
        {seeds.map((seed, i) => (
          <div key={i} className="seed-byte-card">
            <span className="seed-byte-label">
              Seed {i + 1} · {seed.kind}
            </span>
            <code>{formatSeedBytes(seed)}</code>
            <span className="seed-byte-meta">{seed.bytes.length} bytes</span>
          </div>
        ))}
        <div className="seed-byte-card seed-byte-card--result">
          <span className="seed-byte-label">PDA bytes</span>
          <code>{bytesToHex(pdaBytes)}</code>
        </div>
      </div>
    </div>
  );
}
