export type DietType = 'vegan' | 'vegetarian' | 'mixed' | 'non-vegan';
export type CommuteMode = 'walk_bike' | 'public_transit' | 'electric_ev' | 'gas_car';
export type CommuteFrequency = 'none' | 'rarely' | 'often' | 'daily';
export type HomeEnergySource = 'solar' | 'mixed' | 'grid';
export type ElectricityUsage = 'low' | 'medium' | 'high';
export type ShoppingHabit = 'never' | 'rarely' | 'often' | 'very_often';

export interface QuizAnswers {
  commuteMode: CommuteMode;
  commuteFrequency: CommuteFrequency;
  dietType: DietType;
  homeEnergySource: HomeEnergySource;
  electricityUsage: ElectricityUsage;
  shoppingHabits: ShoppingHabit;
}

export interface FootprintBreakdown {
  transport: number;
  food: number;
  homeEnergy: number;
  shopping: number;
  total: number;
}

export interface RecommendedAction {
  id: string;
  action: string;
  category: 'Transport' | 'Food' | 'Home Energy' | 'Shopping';
  savings: number; // kg saved per month
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface CheckInLog {
  week: number;
  savedAmount: number; // cumulative kg CO2e saved
  footprintHistory: FootprintBreakdown;
}

export interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}
