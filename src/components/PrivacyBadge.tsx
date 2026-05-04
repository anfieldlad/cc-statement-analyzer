import Link from "next/link";
import { CheckIcon, ShieldIcon } from "./icons";

const PRIVACY_POINTS = [
  "Your password never leaves this device",
  "No data is stored — ever",
  "Close the tab and everything is gone",
  "No accounts, no cookies, no tracking",
];

export function PrivacyBadge() {
  return (
    <section className="privacy" aria-label="Privacy guarantees">
      <div className="privacy-title">
        <ShieldIcon /> Your Privacy
      </div>
      <ul className="privacy-list">
        {PRIVACY_POINTS.map((point) => (
          <li key={point}>
            <CheckIcon className="privacy-check" width={16} height={16} />
            {point}
          </li>
        ))}
      </ul>
      <div className="privacy-link">
        <Link href="/privacy">
          Read the full privacy policy →
        </Link>
      </div>
    </section>
  );
}
