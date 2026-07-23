import { Link } from "react-router-dom";
import { IconKey, IconShield, IconReceipt } from "../components/Icons";

const apps = [
  {
    to: "/vault",
    icon: IconKey,
    title: "Password Manager",
    desc: "Store and manage your passwords securely with end-to-end encryption.",
  },
  {
    to: "/authenticator",
    icon: IconShield,
    title: "Authenticator",
    desc: "Generate TOTP two-factor authentication codes right from your desktop.",
  },
  {
    to: "/subscriptions",
    icon: IconReceipt,
    title: "Subscriptions",
    desc: "Track your recurring subscriptions and never miss a payment.",
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to Mocha</h1>
      <p>Your personal suite of privacy tools. Select an app to get started.</p>
      <div className="app-grid">
        {apps.map((app) => (
          <Link key={app.to} to={app.to} className="app-card">
            <app.icon />
            <h2>{app.title}</h2>
            <p>{app.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
