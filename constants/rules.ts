// constants/rules.ts — All game rules for Little Business

export interface RuleSection {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

export const RULES: RuleSection[] = [
  {
    id: 'objective',
    title: 'Objective',
    icon: '🎯',
    content: [
      'Be the last player remaining with money — others go bankrupt!',
      'Buy properties, build houses & hotels, collect rent from opponents.',
      'Each player starts with ₹15,000.',
    ],
  },
  {
    id: 'turn',
    title: 'Taking Your Turn',
    icon: '🎲',
    content: [
      'Roll both dice and move that many spaces forward.',
      'If you roll doubles, you get to roll again!',
      'If you roll doubles 3 times in a row → Go straight to Jail!',
      'When you pass START, collect ₹1,500 salary.',
    ],
  },
  {
    id: 'property',
    title: 'Buying Property',
    icon: '🏠',
    content: [
      'Land on an unowned property → choose to buy at the listed price.',
      'If you skip, the property stays available.',
      'Once you own all properties of one color, rent doubles even with no houses!',
      'Build houses (₹2,000–₹7,500 each) only after owning the full color set.',
      'After 4 houses, the next purchase becomes a hotel.',
    ],
  },
  {
    id: 'rent',
    title: 'Paying Rent',
    icon: '💰',
    content: [
      'Land on opponent\'s property → pay them rent.',
      'Rent increases with every house/hotel built.',
      'Transports: rent doubles for each transport owned (Roadways, Railways, Waterways, Airways).',
      'Utilities: 4× dice roll (1 owned), 10× dice roll (both owned).',
      'If you can\'t afford rent, you go bankrupt!',
    ],
  },
  {
    id: 'jail',
    title: 'Jail',
    icon: '⛓️',
    content: [
      'You go to Jail by drawing that card or rolling 3 doubles in a row.',
      'In Jail, you cannot move normally.',
      'Escape options: Roll doubles on your turn (free!), or pay ₹500 bail.',
      'After 3 turns in Jail, you must pay ₹500 and move.',
    ],
  },
  {
    id: 'club',
    title: 'CLUB',
    icon: '🎉',
    content: [
      'Land on CLUB → pay ₹1,500 to the bank.',
      'Think of it as the house cover charge — everyone pays!',
      'Unlike the old "Free Parking", this corner is not free.',
    ],
  },
  {
    id: 'rest_house',
    title: 'REST HOUSE',
    icon: '🏨',
    content: [
      'REST HOUSE is a safe space — nothing happens here.',
      'You don\'t pay rent or do anything special.',
      'Take a breather and plan your next move!',
    ],
  },
  {
    id: 'chance',
    title: 'Chance Cards',
    icon: '❓',
    content: [
      'Land on "Chance" to draw a random card.',
      'Indian-themed events: Diwali Gift, GST Refund, Marriage Celebration, Yashwant Bond...',
      'Could be good (₹500–₹10,000 bonus) or bad (pay tax, go to jail).',
      'You must immediately follow the card\'s instruction.',
    ],
  },
  {
    id: 'community',
    title: 'Community Chest',
    icon: '💌',
    content: [
      'Similar to Chance, but generally more positive cards.',
      'Examples: "Bank error in your favor +₹2,000", "Life Insurance Maturity ₹10,000".',
      'Some negative: "School fees ₹1,500", "Doctor\'s fees ₹500".',
    ],
  },
  {
    id: 'tax',
    title: 'Tax Spaces',
    icon: '💸',
    content: [
      'Income Tax: Pay ₹2,000 to the bank.',
      'Wealth Tax: Pay ₹1,500 to the bank.',
      'Taxes go to the bank, not to other players.',
    ],
  },
  {
    id: 'bankrupt',
    title: 'Bankruptcy',
    icon: '💀',
    content: [
      'When you can\'t afford to pay (rent, tax, etc.) you go bankrupt.',
      'Your remaining money is taken, and your properties returned to the bank.',
      'You\'re out of the game!',
      'Last player remaining wins!',
    ],
  },
];
