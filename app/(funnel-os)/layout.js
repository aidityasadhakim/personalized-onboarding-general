import { Newsreader, Inter } from "next/font/google";
import "./funnel-os.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-serif",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata = {
  title: "Funnel OS — onboarding teardowns",
  description:
    "Paste a URL. Funnel OS captures the onboarding, finds the leaks, and builds a personalized first run.",
};

export default function FunnelOsLayout({ children }) {
  return (
    <html lang="en" data-mode="light" className={`${serif.variable} ${ui.variable}`}>
      <body>
        <div className="isolate h-full">{children}</div>
      </body>
    </html>
  );
}
