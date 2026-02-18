import { Upgrade, ShopItem } from './types';

export const INITIAL_ENERGY = 1000;
export const ENERGY_REGEN_RATE = 1; // per second
export const SAVE_KEY = 'abcedion_game_state_v7';

/** 
 * IMPORTANT: Replace this with your actual TON Wallet Address 
 * Players' payments will be directed here.
 */
export const OWNER_WALLET = 'UQBM8p...YOUR_REAL_TON_WALLET_ADDRESS_HERE';

export const OBSIDIAN_CONVERSION_RATE = 10000;
export const ERIDROP_MILESTONE = 10000000;

export const OBSIDIAN_ICON_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png'; 

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'starter_pack',
    name: { ar: 'باقة المبتدئين', en: 'Starter Pack' },
    priceTon: 0.5,
    reward: 50000,
    icon: '📦'
  },
  {
    id: 'boink_vault',
    name: { ar: 'خزنة النقاط', en: 'Points Vault' },
    priceTon: 2.0,
    reward: 250000,
    icon: '💎'
  },
  {
    id: 'infinite_energy',
    name: { ar: 'طاقة لا نهائية (ساعة)', en: 'Infinite Energy (1h)' },
    priceTon: 1.5,
    reward: 0,
    icon: '⚡'
  }
];

export const UPGRADES: Upgrade[] = [
  {
    id: 'strong_fingers',
    name: { ar: 'أصابع قوية', en: 'Strong Fingers' },
    description: { ar: 'زيادة قوة النقر بمقدار +1', en: 'Increase tapping power by +1' },
    cost: 100,
    increase: 1,
    type: 'tap',
    icon: '👆'
  },
  {
    id: 'auto_clicker',
    name: { ar: 'خنزير صغير', en: 'Baby Piggy' },
    description: { ar: 'يولد +2 نقطة في الثانية', en: 'Generates +2 points per second' },
    cost: 500,
    increase: 2,
    type: 'passive',
    icon: '🐷'
  },
  {
    id: 'boink_drill',
    name: { ar: 'حفار النقاط', en: 'Points Drill' },
    description: { ar: 'يولد +10 نقاط في الثانية', en: 'Generates +10 points per second' },
    cost: 2500,
    increase: 10,
    type: 'passive',
    icon: '⚙️'
  },
  {
    id: 'mega_tap',
    name: { ar: 'نقرة خارقة', en: 'Mega Tap' },
    description: { ar: 'قفزة هائلة +5 في قوة النقر', en: 'Massive +5 jump in tap power' },
    cost: 1500,
    increase: 5,
    type: 'tap',
    icon: '⚡'
  },
  {
    id: 'gold_farm',
    name: { ar: 'مزرعة ذهبية', en: 'Golden Farm' },
    description: { ar: 'تولد +50 نقطة في الثانية', en: 'Generates +50 points per second' },
    cost: 10000,
    increase: 50,
    type: 'passive',
    icon: '🏛️'
  }
];

export const TRANSLATIONS = {
  ar: {
    totalBoinks: 'نقاط Abcedion',
    obsidian: 'عملة أوبسيديان',
    energy: 'الطاقة',
    outOfEnergy: 'نفدت الطاقة!',
    passiveIncome: 'دخل سلبي/ثانية',
    level: 'مستوى',
    upgrades: 'الترقيات',
    tasks: 'المهام',
    eriDrop: 'EriDrop',
    squad: 'الفريق',
    boink: 'الرئيسية',
    inviteFriends: 'دعوة الأصدقاء',
    inviteDesc: 'أحضر فريق الخنازير الخاص بك! اكسب +10% من أرباحهم للأبد.',
    inviteBtn: 'دعوة 🐷',
    dailyTasks: 'المهام اليومية',
    followTg: 'تابعنا على تيليجرام',
    watchVideo: 'شاهد فيديو يومي',
    claim: 'مطالبة',
    play: 'لعب',
    eriDropTitle: 'مشروع EriDrop',
    eriDropSlogan: 'الخيار الذكي هو حظ سعيد',
    eriDropDesc: 'سيتم تحرير EriDrop بمجرد وصولنا إلى 10 ملايين مستخدم.',
    eriDropProgress: 'التقدم نحو الإطلاق (المستخدمين)',
    switchLang: 'English',
    connectWallet: 'ربط المحفظة',
    walletConnected: 'متصل',
    shop: 'المتجر',
    buy: 'شراء',
    insufficientTon: 'رصيد TON غير كافٍ',
    mint: 'سك (Mint)',
    mintReady: 'جاهز للسك!',
    pointsToObsidian: '10,000 نقطة = 1 أوبسيديان',
    confirmPayment: 'تأكيد الدفع',
    sendTo: 'إرسال إلى:',
    payWithTon: 'ادفع بواسطة TON'
  },
  en: {
    totalBoinks: 'Abcedion Points',
    obsidian: 'Obsidian Currency',
    energy: 'Energy',
    outOfEnergy: 'Out of Energy!',
    passiveIncome: 'Passive/Sec',
    level: 'Level',
    upgrades: 'Upgrades',
    tasks: 'Tasks',
    eriDrop: 'EriDrop',
    squad: 'Squad',
    boink: 'Home',
    inviteFriends: 'Invite Friends',
    inviteDesc: 'Bring your piggy squad! Earn +10% of their earnings forever.',
    inviteBtn: 'Invite 🐷',
    dailyTasks: 'Daily Tasks',
    followTg: 'Follow us on Telegram',
    watchVideo: 'Watch Daily Video',
    claim: 'Claim',
    play: 'Play',
    eriDropTitle: 'EriDrop Project',
    eriDropSlogan: 'The intelligent choice is good luck',
    eriDropDesc: 'EriDrop will be released as soon as we reach 10 million users.',
    eriDropProgress: 'Launch Progress (Users)',
    switchLang: 'العربية',
    connectWallet: 'Connect Wallet',
    walletConnected: 'Connected',
    shop: 'Shop',
    buy: 'Buy',
    insufficientTon: 'Insufficient TON',
    mint: 'Mint',
    mintReady: 'Ready to Mint!',
    pointsToObsidian: '10,000 Points = 1 Obsidian',
    confirmPayment: 'Confirm Payment',
    sendTo: 'Send To:',
    payWithTon: 'Pay with TON'
  }
};