export interface Entry {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  folder: string;
}

export interface TOTPAccount {
  id: string;
  issuer: string;
  secret: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | "weekly";
  nextBilling: string;
  notes: string;
  createdAt: string;
}
