"use client";

import { useEffect, useState } from "react";
import { RPC_ENDPOINT } from "../lib/constants";
import { SignalIcon } from "./icons";

export function NetworkStatus() {
  const [latency, setLatency] = useState<number | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      const start = performance.now();
      try {
        const res = await fetch(RPC_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getHealth",
          }),
        });
        if (!cancelled) {
          setOnline(res.ok);
          setLatency(Math.round(performance.now() - start));
        }
      } catch {
        if (!cancelled) {
          setOnline(false);
          setLatency(null);
        }
      }
    }

    ping();
    const interval = setInterval(ping, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="network-card">
      <div className="network-header">
        <span className="network-label">Network</span>
        <span className={`network-status ${online ? "online" : "offline"}`}>
          <span className="status-dot" />
          {online ? "online" : "offline"}
        </span>
      </div>
      <div className="network-row">
        <span className="network-key">Environment</span>
        <span className="network-value">Mainnet Beta</span>
      </div>
      <div className="network-row">
        <span className="network-key">RPC Endpoint</span>
        <span className="network-value network-rpc">{RPC_ENDPOINT}</span>
      </div>
      <div className="network-row network-latency">
        <span className="network-key">Latency</span>
        <span className="network-value latency-value">
          <SignalIcon size={14} />
          {latency !== null ? `${latency}ms` : "—"}
        </span>
      </div>
    </div>
  );
}
