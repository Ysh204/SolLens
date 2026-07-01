import { BoltIcon, HexagonIcon, TerminalIcon } from "./icons";

const FOOTER_ITEMS = [
  {
    icon: HexagonIcon,
    title: "Open Source",
    description: "Built for the community",
  },
  {
    icon: TerminalIcon,
    title: "Developer First",
    description: "CLI, API & Web ready",
  },
  {
    icon: BoltIcon,
    title: "Solana Native",
    description: "Optimized for performance",
  },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      {FOOTER_ITEMS.map((item) => (
        <div key={item.title} className="footer-item">
          <div className="footer-icon-wrap">
            <item.icon className="footer-icon" size={16} />
          </div>
          <div className="footer-copy">
            <div className="footer-title">{item.title}</div>
            <div className="footer-desc">{item.description}</div>
          </div>
        </div>
      ))}
    </footer>
  );
}
