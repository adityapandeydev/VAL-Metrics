export interface WeaponData {
  id: string;
  name: string;
  category: 'Sidearms' | 'SMGs' | 'Shotguns' | 'Rifles' | 'Sniper Rifles' | 'Heavy Weapons' | 'Melee';
  cost: number;
  fireRate: string;
  magazineSize: number | string;
  wallPenetration: 'Low' | 'Medium' | 'High' | 'None';
  iconUrl: string;
  damage: {
    head: number;
    body: number;
    legs: number;
  };
}

export const ALL_WEAPONS: WeaponData[] = [
  // Sidearms (5)
  {
    id: "classic",
    name: "Classic",
    category: "Sidearms",
    cost: 0,
    fireRate: "6.75 rds/sec",
    magazineSize: 12,
    wallPenetration: "Low",
    iconUrl: "https://media.valorant-api.com/weapons/29a06938-4e48-5714-77dd-9bb60237f28a/displayicon.png",
    damage: { head: 78, body: 26, legs: 22 },
  },
  {
    id: "shorty",
    name: "Shorty",
    category: "Sidearms",
    cost: 300,
    fireRate: "3.33 rds/sec",
    magazineSize: 2,
    wallPenetration: "Low",
    iconUrl: "https://media.valorant-api.com/weapons/42da8cee-42fc-2c6e-adc6-a491323a104f/displayicon.png",
    damage: { head: 36, body: 12, legs: 10 },
  },
  {
    id: "frenzy",
    name: "Frenzy",
    category: "Sidearms",
    cost: 450,
    fireRate: "10 rds/sec",
    magazineSize: 13,
    wallPenetration: "Low",
    iconUrl: "https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png",
    damage: { head: 78, body: 26, legs: 22 },
  },
  {
    id: "ghost",
    name: "Ghost",
    category: "Sidearms",
    cost: 500,
    fireRate: "6.75 rds/sec",
    magazineSize: 15,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/1baa85b4-4c70-1284-64bb-6481dfc3bb4e/displayicon.png",
    damage: { head: 105, body: 30, legs: 25 },
  },
  {
    id: "sheriff",
    name: "Sheriff",
    category: "Sidearms",
    cost: 800,
    fireRate: "4 rds/sec",
    magazineSize: 6,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/e3367f0f-4139-817e-acb3-4c80ba7221f7/displayicon.png",
    damage: { head: 159, body: 55, legs: 46 },
  },

  // SMGs (2)
  {
    id: "stinger",
    name: "Stinger",
    category: "SMGs",
    cost: 1100,
    fireRate: "16 rds/sec",
    magazineSize: 20,
    wallPenetration: "Low",
    iconUrl: "https://media.valorant-api.com/weapons/f7e1b454-4ad4-1609-384b-d7824e50b468/displayicon.png",
    damage: { head: 67, body: 27, legs: 22 },
  },
  {
    id: "spectre",
    name: "Spectre",
    category: "SMGs",
    cost: 1600,
    fireRate: "13.33 rds/sec",
    magazineSize: 30,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/462080d1-4035-2937-7c09-27aa2a5c27a7/displayicon.png",
    damage: { head: 78, body: 26, legs: 22 },
  },

  // Shotguns (2)
  {
    id: "bucky",
    name: "Bucky",
    category: "Shotguns",
    cost: 850,
    fireRate: "1.1 rds/sec",
    magazineSize: 5,
    wallPenetration: "Low",
    iconUrl: "https://media.valorant-api.com/weapons/910be174-449b-c412-ab22-d0873436b21b/displayicon.png",
    damage: { head: 44, body: 22, legs: 18 },
  },
  {
    id: "judge",
    name: "Judge",
    category: "Shotguns",
    cost: 1850,
    fireRate: "3.5 rds/sec",
    magazineSize: 7,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/ec84251c-4ccb-a36a-2ac0-f3a0937b6c94/displayicon.png",
    damage: { head: 34, body: 17, legs: 14 },
  },

  // Rifles (4)
  {
    id: "bulldog",
    name: "Bulldog",
    category: "Rifles",
    cost: 2050,
    fireRate: "10 rds/sec",
    magazineSize: 24,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/ae3de142-4d85-2547-dd26-4e90bed35cf7/displayicon.png",
    damage: { head: 115, body: 35, legs: 29 },
  },
  {
    id: "guardian",
    name: "Guardian",
    category: "Rifles",
    cost: 2250,
    fireRate: "5.25 rds/sec",
    magazineSize: 12,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/4ade7faa-4cf1-8376-95ef-39884480959b/displayicon.png",
    damage: { head: 195, body: 65, legs: 48 },
  },
  {
    id: "phantom",
    name: "Phantom",
    category: "Rifles",
    cost: 2900,
    fireRate: "11 rds/sec",
    magazineSize: 30,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a/displayicon.png",
    damage: { head: 156, body: 39, legs: 33 },
  },
  {
    id: "vandal",
    name: "Vandal",
    category: "Rifles",
    cost: 2900,
    fireRate: "9.75 rds/sec",
    magazineSize: 25,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/9c82e14d-4e20-9337-f047-92bb6680a6b9/displayicon.png",
    damage: { head: 160, body: 40, legs: 34 },
  },

  // Sniper Rifles (3)
  {
    id: "marshal",
    name: "Marshal",
    category: "Sniper Rifles",
    cost: 950,
    fireRate: "1.5 rds/sec",
    magazineSize: 5,
    wallPenetration: "Medium",
    iconUrl: "https://media.valorant-api.com/weapons/c4883e50-4494-202c-3ec3-6b8a9284f00b/displayicon.png",
    damage: { head: 202, body: 101, legs: 85 },
  },
  {
    id: "outlaw",
    name: "Outlaw",
    category: "Sniper Rifles",
    cost: 2400,
    fireRate: "2.75 rds/sec",
    magazineSize: 2,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/5f0aaf3a-4b64-2d4f-51d7-38a4180ce2ce/displayicon.png",
    damage: { head: 238, body: 140, legs: 119 },
  },
  {
    id: "operator",
    name: "Operator",
    category: "Sniper Rifles",
    cost: 4700,
    fireRate: "0.6 rds/sec",
    magazineSize: 5,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/a03b24d3-4319-996d-0f8c-94bbfba1dfc7/displayicon.png",
    damage: { head: 255, body: 150, legs: 120 },
  },

  // Heavy Weapons (2)
  {
    id: "ares",
    name: "Ares",
    category: "Heavy Weapons",
    cost: 1600,
    fireRate: "10-13 rds/sec",
    magazineSize: 50,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/55d8a0f4-4274-ca67-fe2c-06ab45efdf58/displayicon.png",
    damage: { head: 72, body: 30, legs: 25 },
  },
  {
    id: "odin",
    name: "Odin",
    category: "Heavy Weapons",
    cost: 3200,
    fireRate: "12-15.6 rds/sec",
    magazineSize: 100,
    wallPenetration: "High",
    iconUrl: "https://media.valorant-api.com/weapons/63e6c2b6-4a8e-869c-3d4c-e38355226584/displayicon.png",
    damage: { head: 95, body: 38, legs: 32 },
  },

  // Melee (1)
  {
    id: "melee",
    name: "Tactical Knife",
    category: "Melee",
    cost: 0,
    fireRate: "1.33 strikes/sec",
    magazineSize: "Infinite",
    wallPenetration: "None",
    iconUrl: "https://media.valorant-api.com/weapons/2f59173c-4bed-b6c3-2191-dea9b58be9c7/displayicon.png",
    damage: { head: 100, body: 50, legs: 50 },
  },
];
