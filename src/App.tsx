import React, { useState, useEffect } from 'react';
import { Leaf, Info, HelpCircle, ShieldAlert, Sparkles, HelpCircle as HelpIcon, CheckCircle, Sun, Moon, Eye } from 'lucide-react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { QuizAnswers } from './types';

export default function App() {
  const [answers, setAnswers] = useState<QuizAnswers | null>(() => {
    const saved = localStorage.getItem('ecosetu_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved profile metadata:", e);
      }
    }
    return null;
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Theme support
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ecosetu_dark_mode') === 'true';
  });

  const [nightLight, setNightLight] = useState<boolean>(() => {
    return localStorage.getItem('ecosetu_night_light') === 'true';
  });

  const handleQuizComplete = (completedAnswers: QuizAnswers) => {
    setAnswers(completedAnswers);
    localStorage.setItem('ecosetu_profile', JSON.stringify(completedAnswers));
    setNotification("Calculations parsed successfully! Dynamic dashboard generated.");
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm("Do you want to clear your current onboarding parameters and retake the quiz?")) {
      setAnswers(null);
      localStorage.removeItem('ecosetu_profile');
      localStorage.removeItem('ecosetu_logs');
      localStorage.removeItem('ecosetu_cumulative_saved');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-950 transition-colors duration-300 relative ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`} id="main-layout">
      
      {/* Night Light Overlaid filter */}
      {nightLight && (
        <div 
          className="fixed inset-0 pointer-events-none bg-amber-500/8 mix-blend-multiply z-50 transition-opacity duration-500" 
          id="night-light-overlay"
        />
      )}

      {/* Top Navigation Header */}
      <header className={`sticky top-0 backdrop-blur-md border-b z-20 transition-colors duration-300 ${
        darkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white/80 border-gray-100/80'
      }`} id="header">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20" id="icon-logo">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className={`font-extrabold text-lg tracking-tight leading-none block ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>EcoSetu</span>
              <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Personal Carbon Bridge</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Night Light Toggle Button */}
            <button
              onClick={() => {
                const next = !nightLight;
                setNightLight(next);
                localStorage.setItem('ecosetu_night_light', String(next));
              }}
              className={`p-2.5 rounded-full border transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                nightLight 
                  ? 'bg-amber-100 border-amber-300 text-amber-700' 
                  : darkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100'
              }`}
              title="Toggle Night Light Mode"
              id="btn-toggle-night"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                localStorage.setItem('ecosetu_dark_mode', String(next));
              }}
              className={`p-2.5 rounded-full border transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100'
              }`}
              title="Toggle Dark Mode"
              id="btn-toggle-dark"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <span className={`hidden sm:inline-block border rounded-full px-3 py-1 font-mono text-[10px] uppercase font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              Beta preview mode
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Banner Alert System */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-55 border border-emerald-100 bg-emerald-500 text-white rounded-2xl flex items-center gap-3 text-xs font-semibold animate-slide-up" id="top-notification">
            <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
            <p>{notification}</p>
          </div>
        )}

        {/* Dynamic Route toggler */}
        {!answers ? (
          <div className="space-y-8 py-4">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-widest inline-block ${
                darkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-emerald-100 text-emerald-800 border-emerald-250'
              }`}>Sustainability Coach Engine</span>
              <h1 className={`text-3xl md:text-3xl font-extrabold tracking-tight ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Understand and Shrink Your Carbon Footprint
              </h1>
              <p className={`text-sm max-w-md mx-auto leading-relaxed ${
                darkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Complete a 2-minute lifestyle snapshot. Our AI Carbon Coach will isolate high-tier emissions and draft a tailored action blueprint specific to you.
              </p>
            </div>

            <Onboarding onComplete={handleQuizComplete} darkMode={darkMode} />
          </div>
        ) : (
          <Dashboard answers={answers} onReset={handleReset} darkMode={darkMode} />
        )}
      </main>

      {/* Footer disclaimer and meta context */}
      <footer className={`border-t py-6 shrink-0 mt-12 transition-colors duration-300 ${
        darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-gray-100'
      }`} id="footer">
        <div className="max-w-6xl mx-auto px-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} EcoSetu. Mitigating climate change through micro-coaching habits.</p>
          <div className="flex items-center gap-4">
            <a href="#" className={`hover:text-slate-700 font-semibold transition ${darkMode ? 'text-slate-400 hover:text-slate-200' : ''}`}>Privacy</a>
            <span>•</span>
            <a href="#" className={`hover:text-slate-700 font-semibold transition ${darkMode ? 'text-slate-400 hover:text-slate-200' : ''}`}>Sources & Calculation Factors</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
