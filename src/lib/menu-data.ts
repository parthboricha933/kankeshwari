export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  subOptions?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: "chinese",
    name: "Chinese",
    icon: "🥡",
    items: [
      { id: "ch-1", name: "Paneer Or Mushroom Chilly", price: 220 },
      { id: "ch-2", name: "Veg. Manchurian Or Veg. 65 Dry", price: 169 },
      { id: "ch-3", name: "Dragon Potato", price: 169 },
      { id: "ch-4", name: "Chinese Bhel", price: 134 },
      { id: "ch-5", name: "Selection Of Noodles", price: 165, subOptions: "Hakka or Szechwan" },
      { id: "ch-6", name: "Selection Of Fried Rice", price: 165, subOptions: "Vegetable or Szechwan" },
      { id: "ch-7", name: "Tripple Combo", price: 269 },
      { id: "ch-8", name: "Crispy Fried Babycorn", price: 189 },
      { id: "ch-9", name: "Crispy Fried Veg", price: 189 },
    ],
  },
  {
    id: "paneer",
    name: "Paneer",
    icon: "🧀",
    items: [
      { id: "pn-1", name: "Paneer Lababdar Or Koriyala", price: 224 },
      { id: "pn-2", name: "Paneer Bagdadi Or Ashiyana", price: 234 },
      { id: "pn-3", name: "Paneer Butter Masala", price: 209 },
      { id: "pn-4", name: "Paneer Tikka Masala", price: 219 },
      { id: "pn-5", name: "Paneer Handi / Tawa / Kadai", price: 199 },
      { id: "pn-6", name: "Paneer Maska Makhni", price: 214 },
      { id: "pn-7", name: "Kaju Paneer", price: 245 },
      { id: "pn-8", name: "Palak Or Mutter Paneer", price: 199 },
      { id: "pn-9", name: "Cheese Butter Masala", price: 245 },
      { id: "pn-10", name: "Paneer Bhurji", price: 245 },
    ],
  },
  {
    id: "sweet",
    name: "Sweet",
    icon: "🍯",
    items: [
      { id: "sw-1", name: "Navratan Korma", price: 239 },
      { id: "sw-2", name: "Cheese Angoori", price: 239 },
      { id: "sw-3", name: "Malai Kofta", price: 229 },
    ],
  },
  {
    id: "vegetables",
    name: "Vegetable's",
    icon: "🥬",
    items: [
      { id: "vg-1", name: "Sev Tomato", price: 139 },
      { id: "vg-2", name: "Lasaniya Bateka", price: 169 },
      { id: "vg-3", name: "Dum Aloo", price: 169 },
      { id: "vg-4", name: "Aloo Tomato Rasawala", price: 169 },
      { id: "vg-5", name: "Cabbege Mutter", price: 169 },
      { id: "vg-6", name: "Vegetable Lababdar / Khazana", price: 205 },
      { id: "vg-7", name: "Vegetable Shabnam / Shabnam Curry", price: 219 },
      { id: "vg-8", name: "Cholle Peshawari", price: 189 },
      { id: "vg-9", name: "Subz Achari / Jalfrzie", price: 199 },
      { id: "vg-10", name: "Veg. Handi / Kadai / Tawa", price: 189 },
      { id: "vg-11", name: "Tomato Makai Bharta", price: 189 },
      { id: "vg-12", name: "Vegetable Koriyala", price: 204 },
      { id: "vg-13", name: "Veg. Kolapuri / Makhanwala", price: 169 },
      { id: "vg-14", name: "Alu Mutter / Jeera Aloo", price: 159 },
    ],
  },
  {
    id: "dal-rice",
    name: "Dal & Rice",
    icon: "🍚",
    items: [
      { id: "dr-1", name: "Dal Fry", price: 119 },
      { id: "dr-2", name: "Dal Tadkewali", price: 129 },
      { id: "dr-3", name: "Steam Rice", price: 109 },
      { id: "dr-4", name: "Jeera Rice", price: 119 },
      { id: "dr-5", name: "Hydrabadi Biryani", price: 159 },
      { id: "dr-6", name: "Vegetable Pulao", price: 134 },
      { id: "dr-7", name: "Kadhi", price: 89 },
      { id: "dr-8", name: "Dal Khichdi", price: 139 },
      { id: "dr-9", name: "Dum Biriyani", price: 159 },
    ],
  },
  {
    id: "tandoor",
    name: "Tandoor",
    icon: "🫓",
    items: [
      { id: "tn-1", name: "Roti (Plain Or Butter)", price: 22 },
      { id: "tn-2", name: "Tawa Roti", price: 20 },
      { id: "tn-3", name: "Garlic Roti", price: 45 },
      { id: "tn-4", name: "Kulcha (Plain Or Butter)", price: 40 },
      { id: "tn-5", name: "Cheese Or Garlic Kulcha", price: 99 },
      { id: "tn-6", name: "Stuffed Kulcha", price: 89 },
      { id: "tn-7", name: "Paratha (Plain Or Butter)", price: 40 },
      { id: "tn-8", name: "Stuffed Paratha", price: 89 },
      { id: "tn-9", name: "Tawa Paratha", price: 35 },
      { id: "tn-10", name: "Nan (Plain Or Butter)", price: 40 },
      { id: "tn-11", name: "Cheese Or Garlic Nan", price: 99 },
      { id: "tn-12", name: "Stuffed Nan", price: 89 },
      { id: "tn-13", name: "Cheese Chilly Nan", price: 109 },
      { id: "tn-14", name: "Cheese Garlic Nan", price: 109 },
    ],
  },
  {
    id: "fix-meal",
    name: "Fix Meal",
    icon: "🍽️",
    items: [
      {
        id: "fm-1",
        name: "Gujarati Thali",
        price: 149,
        description: "One Veg. Kathol Dal, Rice, Butter Milk, Papad, Four Chapathi",
      },
      {
        id: "fm-2",
        name: "Punjabi Thali",
        price: 219,
        description: "One Paneer, One Veg., Dal, Rice, Papad Butter Milk, Two Tand. Roti, Ice Cream",
      },
      {
        id: "fm-3",
        name: "Spl. Gujarati Thali",
        price: 179,
        description: "Farsan, One Veg. Kathol Dal, Rice, Butter Milk, Papad, Four Chapathi, Ice Cream",
      },
      {
        id: "fm-4",
        name: "Spl. Punjabi Thali",
        price: 249,
        description: "Soup, One Paneer, One Veg., Dal, Rice, Papad Butter Milk, Two Tand. Roti, Ice Cream",
      },
    ],
  },
  {
    id: "dessert",
    name: "Dessert",
    icon: "🍨",
    items: [
      { id: "ds-1", name: "Flavored Ice Cream", price: 39, subOptions: "Vanilla, Strawberry" },
      { id: "ds-2", name: "Chocolate, Mango", price: 49 },
      { id: "ds-3", name: "Kesar Pista", price: 55 },
      { id: "ds-4", name: "Butter Scotch", price: 55 },
      { id: "ds-5", name: "J.K Special Ice Cream", price: 144 },
      { id: "ds-6", name: "Gulab Jamoon", price: 49 },
      { id: "ds-7", name: "Milk Shake", price: 99 },
      { id: "ds-8", name: "Milk Shake With Ice Cream", price: 129 },
      { id: "ds-9", name: "Cold Coffee", price: 89 },
      { id: "ds-10", name: "Cold Coffee With Ice Cream", price: 109 },
    ],
  },
];
