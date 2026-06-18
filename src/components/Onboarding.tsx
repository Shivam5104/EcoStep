import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Leaf, 
  Zap, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Compass, 
  Bike, 
  Bus, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { QuizAnswers, CommuteMode, CommuteFrequency, DietType, HomeEnergySource, ElectricityUsage, ShoppingHabit } from '../types';

interface OnboardingProps {
  onComplete: (answers: QuizAnswers) => void;
  darkMode?: boolean;
}

interface Question {
  id: keyof QuizAnswers;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  options: {
    value: string;
    label: string;
    description: string;
    bgIcon: string;
  }[];
}

export default function Onboarding({ onComplete, darkMode = false }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    commuteMode: 'gas_car',
    commuteFrequency: 'often',
    dietType: 'mixed',
    homeEnergySource: 'grid',
    electricityUsage: 'medium',
    shoppingHabits: 'rarely'
  });

  const questions: Question[] = [
    {
      id: 'commuteMode',
      title: 'How do you usually commute?',
      subtitle: 'Pick your primary mode of transportation.',
      icon: <Car className="w-6 h-6 text-emerald-600" id="icon-commute" />,
      options: [
        { value: 'gas_car', label: 'Gasoline/Diesel Car', description: 'Petrol or gas engines, private ride', bgIcon: '🚗' },
        { value: 'electric_ev', label: 'Electric / Hybrid EV', description: 'Fully electric, plug-in or standard hybrid', bgIcon: '⚡️' },
        { value: 'public_transit', label: 'Public Transit', description: 'City bus, train, subway or tram', bgIcon: '🚌' },
        { value: 'walk_bike', label: 'Active Transit', description: 'Walking, cycling, or kick scooter', bgIcon: '🚲' }
      ]
    },
    {
      id: 'commuteFrequency',
      title: 'How often do you commute?',
      subtitle: 'Estimate your average weekly transit occurrences.',
      icon: <Compass className="w-6 h-6 text-emerald-600" id="icon-freq" />,
      options: [
        { value: 'daily', label: 'Daily (5-7 days)', description: 'Daily commutes to work, study, or social events', bgIcon: '📅' },
        { value: 'often', label: 'Often (2-4 days)', description: 'Partial commute or semi-frequent transport', bgIcon: '🔁' },
        { value: 'rarely', label: 'Rarely (1-2 days)', description: 'Mostly stay local, occasional visits', bgIcon: '🌤️' },
        { value: 'none', label: 'None (Fully Remote)', description: 'Stay-at-home or purely local neighborhood living', bgIcon: '🏡' }
      ]
    },
    {
      id: 'dietType',
      title: 'What does your daily diet look like?',
      subtitle: 'Food production forms a large slice of global carbon footprint.',
      icon: <Leaf className="w-6 h-6 text-emerald-600" id="icon-diet" />,
      options: [
        { value: 'non-vegan', label: 'Regular Meat Eater', description: 'Consumes beef, pork, poultry and dairy often', bgIcon: '🍖' },
        { value: 'mixed', label: 'Mixed / Flexitarian', description: 'Mostly plants, chicken/fish, occasional red meats', bgIcon: '🥗' },
        { value: 'vegetarian', label: 'Vegetarian', description: 'No meats, but includes eggs, cheese, and dairy', bgIcon: '🧀' },
        { value: 'vegan', label: 'Vegan', description: '100% plant-based food items only', bgIcon: '🌱' }
      ]
    },
    {
      id: 'homeEnergySource',
      title: 'What is your primary home energy source?',
      subtitle: 'Grid power types vary massively in environmental impact.',
      icon: <Zap className="w-6 h-6 text-emerald-600" id="icon-energy" />,
      options: [
        { value: 'grid', label: 'Fossil Grid', description: 'Coal, gas, and default municipal grid structure', bgIcon: '🏭' },
        { value: 'mixed', label: 'Mixed / Carbon Offset', description: 'Standard grid backed by modern renewable credits', bgIcon: '🌀' },
        { value: 'solar', label: 'Private Solar power', description: 'Rooftop solar arrays, or 100% green wind tariffs', bgIcon: '☀️' }
      ]
    },
    {
      id: 'electricityUsage',
      title: 'What is your rough monthly electricity scale?',
      subtitle: 'Based on your apartment, house size, and appliance choices.',
      icon: <Zap className="w-6 h-6 text-emerald-600" id="icon-usage" />,
      options: [
        { value: 'low', label: 'Low (< 150 kWh)', description: 'Small apartment, natural venting, very low usage', bgIcon: '🔌' },
        { value: 'medium', label: 'Medium (150 - 300 kWh)', description: 'Standard single family home, moderate cooling/heating', bgIcon: '🏠' },
        { value: 'high', label: 'High (300+ kWh)', description: 'Large multi-level structure or intense HVAC reliance', bgIcon: '🏰' }
      ]
    },
    {
      id: 'shoppingHabits',
      title: 'How frequently do you buy new goods?',
      subtitle: 'New clothes, gadgets, homeware, or electronics.',
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" id="icon-shop" />,
      options: [
        { value: 'very_often', label: 'Very Often (Weekly)', description: 'Avid shopper, love staying on top of trends', bgIcon: '🛍️' },
        { value: 'often', label: 'Often (Monthly)', description: 'Regular retail visits for wardrobe or utility updates', bgIcon: '👕' },
        { value: 'rarely', label: 'Rarely (Mandatory cases)', description: 'Buy only when existing goods hit end-of-life', bgIcon: '📦' },
        { value: 'never', label: 'Thrift First / Minimalist', description: 'Almost solely purchase secondhand/vintage items', bgIcon: '🔄' }
      ]
    }
  ];

  const currentQ = questions[currentStep];

  const handleSelect = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(answers as QuizAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progressPct = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className={`w-full max-w-xl mx-auto rounded-3xl shadow-sm overflow-hidden transition-all duration-300 border ${
      darkMode 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-100'
    }`} id="onboarding-container">
      {/* Quiz Progress Header */}
      <div className={`px-6 pt-6 pb-2 border-b transition-colors duration-300 ${
        darkMode 
          ? 'border-slate-800 bg-slate-900/40' 
          : 'border-slate-50 bg-slate-50/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${
              darkMode ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-xs font-semibold tracking-wider uppercase block ${
                darkMode ? 'text-emerald-400' : 'text-emerald-800'
              }`}>EcoSetu Onboarding</span>
              <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Step {currentStep + 1} of {questions.length}</span>
            </div>
          </div>
          <span className={`text-xs font-mono font-bold ${darkMode ? 'text-slate-400' : 'text-gray-650'}`}>{Math.round(progressPct)}%</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden transition-colors ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <motion.div 
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Stepper Card Body */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: -20, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {currentQ.icon}
                <h2 className={`text-xl font-bold tracking-tight leading-snug transition-colors ${
                  darkMode ? 'text-slate-100' : 'text-slate-800'
                }`} id="question-title">
                  {currentQ.title}
                </h2>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-550'}`}>{currentQ.subtitle}</p>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 gap-3.5" id="options-container">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    id={`opt-${opt.value}`}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? darkMode 
                          ? 'border-emerald-500 bg-emerald-950/25 shadow-sm ring-1 ring-emerald-500/20'
                          : 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/20' 
                        : darkMode
                          ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <span className="text-2xl mr-4 flex-shrink-0 select-none">{opt.bgIcon}</span>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-sm font-semibold transition-colors ${
                        isSelected 
                          ? darkMode ? 'text-emerald-300' : 'text-emerald-900' 
                          : darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs mt-0.5 line-clamp-2 transition-colors ${
                        darkMode ? 'text-slate-400' : 'text-gray-400'
                      }`}>
                        {opt.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600 fill-emerald-50'}`} />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation Controls */}
        <div className={`flex items-center justify-between pt-8 mt-8 border-t transition-colors ${
          darkMode ? 'border-slate-800' : 'border-slate-50'
        }`}>
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            id="btn-back"
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentStep === 0 
                ? 'text-gray-350 opacity-25 cursor-not-allowed' 
                : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            id="btn-next"
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer ${
              darkMode 
                ? 'bg-emerald-600 hover:bg-emerald-550 text-white shadow-emerald-900/10' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
            }`}
          >
            {currentStep === questions.length - 1 ? (
              <>
                Show Environmental Dashboard
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
