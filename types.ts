export type Language = 'ar' | 'en';

export interface GameState {
  balance: number;
  totalEarned: number;
  energy: number;
  maxEnergy: number;
  tapPower: number;
  passiveIncome: number;
  level: number;
  lastUpdate: number;
  language?: Language;
  walletAddress?: string | null;
  obsidianBalance: number;
  customObsidianIcon?: string | null;
}

export interface Upgrade {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  cost: number;
  increase: number;
  type: 'tap' | 'passive';
  icon: string;
}

export enum Tab {
  HOME = 'home',
  EARN = 'earn',
  UPGRADES = 'upgrades',
  ERIDROP = 'eridrop',
  FRIENDS = 'friends',
  SHOP = 'shop'
}

export interface ShopItem {
  id: string;
  name: { ar: string; en: string };
  priceTon: number;
  reward: number;
  icon: string;
}