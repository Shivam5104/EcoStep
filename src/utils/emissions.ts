import { QuizAnswers, FootprintBreakdown } from '../types';

// Emission factors in kg CO2e per month
export const EMISSION_FACTORS = {
  transport: {
    walk_bike: { none: 0, rarely: 0, often: 0, daily: 0 },
    electric_ev: { none: 0, rarely: 10, often: 30, daily: 55 },
    public_transit: { none: 0, rarely: 5, often: 20, daily: 40 },
    gas_car: { none: 0, rarely: 60, often: 160, daily: 290 }
  },
  food: {
    vegan: 60,
    vegetarian: 110,
    mixed: 160,
    'non-vegan': 270
  },
  homeEnergy: {
    kWh: {
      low: 120,    // kWh per month equivalent
      medium: 280, // kWh per month equivalent
      high: 500    // kWh per month equivalent
    },
    multiplier: {
      grid: 0.45,  // kg CO2e per kWh for general electricity grid
      mixed: 0.22, // kg CO2e per kWh for mixed source carbon footprint
      solar: 0.04  // kg CO2e per kWh for home solar systems
    }
  },
  shopping: {
    never: 5,
    rarely: 20,
    often: 60,
    very_often: 140
  }
};

// Benchmark averages for monthly carbon footprints per person
export const FOOTPRINT_BENCHMARKS = {
  globalAverage: 400, // Monthly average in kg CO2e
  nationalAverage: 1250 // US/Western national average in kg CO2e
};

export function calculateFootprint(answers: QuizAnswers): FootprintBreakdown {
  const transport = EMISSION_FACTORS.transport[answers.commuteMode][answers.commuteFrequency] || 0;
  
  const food = EMISSION_FACTORS.food[answers.dietType] || 0;
  
  const baseKwh = EMISSION_FACTORS.homeEnergy.kWh[answers.electricityUsage] || 250;
  const sourceMult = EMISSION_FACTORS.homeEnergy.multiplier[answers.homeEnergySource] || 0.45;
  const homeEnergy = Math.round(baseKwh * sourceMult);
  
  const shopping = EMISSION_FACTORS.shopping[answers.shoppingHabits] || 0;
  
  const total = transport + food + homeEnergy + shopping;
  
  return {
    transport,
    food,
    homeEnergy,
    shopping,
    total
  };
}
