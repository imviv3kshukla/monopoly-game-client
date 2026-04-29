// constants/rules.ts — All game rules text in one place

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
      'When you pass GO, collect ₹2,000 salary.',
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
      'Build houses (₹500–₹2000 each) only after owning the full color set.',
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
      'Railways: ₹2,000 (1 owned), ₹4,000 (2), ₹8,000 (3), ₹16,000 (all 4).',
      'Utilities: 4× dice roll (1 owned), 10× dice roll (both owned).',
      'If you can\'t afford rent, you go bankrupt!',
    ],
  },
  {
    id: 'jail',
    title: 'Jail',
    icon: '⛓️',
    content: [
      'You go to Jail by: landing on "Go To Jail", drawing that card, or rolling 3 doubles.',
      'In Jail, you cannot collect rent or move normally.',
      'Escape options: Roll doubles on your turn (free!), or pay ₹500 bail.',
      'After 3 turns in Jail, you must pay ₹500 and move.',
    ],
  },
  {
    id: 'chance',
    title: 'Chance Cards',
    icon: '❓',
    content: [
      'Land on "Chance" to draw a random card.',
      'Could be good (₹500 dividend, advance to GO) or bad (pay tax, go to jail).',
      'Examples: "Bank pays you ₹500", "Pay income tax ₹1,500", "Advance to Shimla".',
      'You must immediately follow the card\'s instruction.',
    ],
  },
  {
    id: 'community',
    title: 'Community Chest',
    icon: '💌',
    content: [
      'Similar to Chance, but generally more positive cards.',
      'Examples: "Bank error in your favor +₹2,000", "Inherit ₹10,000".',
      'Some negative: "School fees ₹1,500", "Doctor\'s fees ₹500".',
    ],
  },
  {
    id: 'tax',
    title: 'Tax Spaces',
    icon: '💸',
    content: [
      'Income Tax: Pay ₹2,000 to the bank.',
      'Luxury Tax: Pay ₹1,000 to the bank.',
      'Taxes go to the bank, not to other players.',
    ],
  },
  {
    id: 'parking',
    title: 'Free Parking',
    icon: '🅿️',
    content: [
      'A safe space — nothing happens here.',
      'You don\'t pay rent or do anything special.',
      'Some house rules collect taxes here, but standard rules say it\'s just a rest stop.',
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
