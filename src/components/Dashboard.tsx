import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  Sparkles, 
  Users, 
  Globe, 
  Compass, 
  HelpCircle, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  X, 
  Check,
  ChevronRight,
  MessageSquare,
  BookmarkCheck,
  Shield,
  Zap,
  Car,
  Leaf,
  ShoppingBag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { QuizAnswers, FootprintBreakdown, RecommendedAction, CheckInLog } from '../types';
import { calculateFootprint, FOOTPRINT_BENCHMARKS } from '../utils/emissions';

interface DashboardProps {
  answers: QuizAnswers;
  onReset: () => void;
  darkMode?: boolean;
}

export default function Dashboard({ answers, onReset, darkMode = false }: DashboardProps) {
  const footprint = calculateFootprint(answers);
  
  // States
  const [recommendations, setRecommendations] = useState<RecommendedAction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]); // Checked actions
  const [recsMode, setRecsMode] = useState<'gemini' | 'fallback'>('gemini');
  const [coachMode, setCoachMode] = useState<'gemini' | 'fallback'>('gemini');
  
  // Weekly Logs for trend line. Default starting with the original base footprint, before savings.
  const [logs, setLogs] = useState<CheckInLog[]>(() => {
    const saved = localStorage.getItem('ecosetu_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Seed with Week 0 (original profile status)
    return [
      { week: 0, savedAmount: 0, footprintHistory: { ...footprint } }
    ];
  });

  const [currentWeek, setCurrentWeek] = useState(() => {
    return logs.length;
  });

  // Stored Savings Counter (Total kg saved overall from all weekly check-ins)
  const [cumulativeSaved, setCumulativeSaved] = useState(() => {
    const saved = localStorage.getItem('ecosetu_cumulative_saved');
    return saved ? parseFloat(saved) : 0;
  });

  // Conversation/Coach States
  const [messages, setMessages] = useState<{ id: string; sender: 'user' | 'coach'; text: string; timestamp: string }[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Welcome to EcoSetu! I'm your Sustainability Coach. Looking at your quiz, your transport is ${footprint.transport} kg CO2e/mo and food is ${footprint.food} kg CO2e/mo. Ask me anything about simple lifestyle changes!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);

  // Load and cache action recommendations from server side Gemini integration
  useEffect(() => {
    const fetchRecs = async () => {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: answers, footprint })
        });
        const data = await res.json();
        if (data.recommendations && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        }
        if (data.mode) {
          setRecsMode(data.mode);
        }
      } catch (err) {
        console.error("Error fetching actions:", err);
        setRecsMode('fallback');
      } finally {
        setIsGenerating(false);
      }
    };
    fetchRecs();
  }, [answers]);

  // Synchronize values with Local Storage whenever values mutate
  useEffect(() => {
    localStorage.setItem('ecosetu_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('ecosetu_cumulative_saved', String(cumulativeSaved));
  }, [cumulativeSaved]);

  // Toggle Adopted Status inside checklist
  const handleToggleAction = (id: string) => {
    if (selectedRecommendations.includes(id)) {
      setSelectedRecommendations(prev => prev.filter(item => item !== id));
    } else {
      setSelectedRecommendations(prev => [...prev, id]);
    }
  };

  // Submit Logger representing a Weekly check-in cycle
  const handleWeeklyCheckIn = () => {
    // Sum savings of selected adopted actions
    let weekSavings = 0;
    recommendations.forEach(rec => {
      if (selectedRecommendations.includes(rec.id)) {
        weekSavings += rec.savings;
      }
    });

    const nextCumulative = cumulativeSaved + weekSavings;
    setCumulativeSaved(nextCumulative);

    // Formulate a relative reduction index
    const originalFootprint = footprint.total;
    const adjustedTotal = Math.max(0, originalFootprint - weekSavings);
    
    // Scale down category parameters relative to active savings
    const reductionFactor = originalFootprint > 0 ? (adjustedTotal / originalFootprint) : 1;
    const futureFootprint: FootprintBreakdown = {
      transport: Math.round(footprint.transport * reductionFactor),
      food: Math.round(footprint.food * reductionFactor),
      homeEnergy: Math.round(footprint.homeEnergy * reductionFactor),
      shopping: Math.round(footprint.shopping * reductionFactor),
      total: adjustedTotal
    };

    const newLog: CheckInLog = {
      week: currentWeek,
      savedAmount: nextCumulative,
      footprintHistory: futureFootprint
    };

    setLogs(prev => [...prev, newLog]);
    setCurrentWeek(prev => prev + 1);

    // Push a Coach notification congratulating the user
    const coachCongratulate: typeof messages[0] = {
      id: `system-msg-${Date.now()}`,
      sender: 'coach',
      text: weekSavings > 0 
        ? `Magnificent! By checking in and adopting those habits, you cut ${weekSavings} kg of greenhouse gas emissions this week. Your cumulative progress is now at ${nextCumulative} kg Co2e saved!`
        : `Thanks for completing your check-in! Keeping aware of our footprint is the precursor to change. Let's aim to stick to 1 simple action next week.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, coachCongratulate]);

    // Reset current checked state for next week
    setSelectedRecommendations([]);
  };

  // Reset progress history only (keeps quiz)
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to reset your check-in history & trend line?")) {
      setLogs([{ week: 0, savedAmount: 0, footprintHistory: { ...footprint } }]);
      setCumulativeSaved(0);
      setCurrentWeek(1);
      setSelectedRecommendations([]);
    }
  };

  // Ask Sustainability Coach Message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMessage) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);

    const newUserMessage: typeof messages[0] = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: answers,
          footprint,
          messages: [...messages, newUserMessage]
        })
      });

      const data = await res.json();
      if (data.mode) {
        setCoachMode(data.mode);
      }
      const coachReply: typeof messages[0] = {
        id: `coach-reply-${Date.now()}`,
        sender: 'coach',
        text: data.text || "I'm looking into your green question. Remember, any small step counts!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, coachReply]);
    } catch (error) {
      console.error("Coach transmission error:", error);
      setCoachMode('fallback');
      const errReply: typeof messages[0] = {
        id: `coach-error-${Date.now()}`,
        sender: 'coach',
        text: "My communication frequencies momentarily dipped. As a thumb-rule, changing commutes or thermostat bands makes an immediate green impact!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errReply]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Categories metadata
  const categoriesMeta = [
    { name: 'Transport', value: footprint.transport, color: 'bg-emerald-500', icon: <Car className="w-4 h-4" /> },
    { name: 'Food', value: footprint.food, color: 'bg-teal-500', icon: <Leaf className="w-4 h-4" /> },
    { name: 'Home Energy', value: footprint.homeEnergy, color: 'bg-amber-500', icon: <Zap className="w-4 h-4" /> },
    { name: 'Shopping', value: footprint.shopping, color: 'bg-indigo-500', icon: <ShoppingBag className="w-4 h-4" /> }
  ].filter(c => c.value >= 0);

  // Recharts chart data
  const chartData = logs.map((log) => ({
    name: `Week ${log.week}`,
    Footprint: log.footprintHistory.total,
    Saved: log.savedAmount,
  }));

  // Latest Trend point to display in charts
  const latestLog = logs[logs.length - 1];
  const currentTotalFootprint = latestLog ? latestLog.footprintHistory.total : footprint.total;

  return (
    <div className={`max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-12 font-sans ${
      darkMode ? 'text-slate-100' : 'text-slate-800'
    }`} id="dashboard-main">
      
      {/* Top Quiet Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b transition-colors duration-300 ${
        darkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className={`text-xs font-mono tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Personal Carbon Budget</span>
          </div>
          <h1 className={`text-2xl font-semibold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>EcoSetu Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            id="btn-re-onboard"
            className={`px-4 py-2 text-xs font-semibold rounded-full transition duration-150 active:scale-95 shadow-sm cursor-pointer ${
              darkMode 
                ? 'bg-slate-900 text-slate-350 border border-slate-800 hover:border-slate-700 hover:text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            Retake Quiz
          </button>
          <button
            onClick={handleClearHistory}
            id="btn-clear-history"
            className={`px-4 py-2 text-xs font-semibold rounded-full transition duration-150 active:scale-95 cursor-pointer ${
              darkMode 
                ? 'bg-red-950/20 text-red-400 border border-red-900/40 hover:bg-red-900/20' 
                : 'bg-red-50 text-red-650 border border-red-100 hover:bg-red-100/70 text-red-600'
            }`}
          >
            Clear Log History
          </button>
        </div>
      </div>

      {/* Hero Footprint Metric Section */}
      <div 
        className={`border rounded-[2rem] p-8 md:p-12 text-center space-y-6 relative overflow-hidden transition-colors ${
          darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'
        }`}
        id="card-monthly-total"
      >
        <span className={`text-xs uppercase font-semibold tracking-widest font-mono ${
          darkMode ? 'text-slate-400' : 'text-slate-400'
        }`}>
          Estimated Monthly Footprint
        </span>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-7xl md:text-8xl font-light tracking-tighter ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`} id="footprint-num">
              {currentTotalFootprint}
            </span>
            <span className="text-lg font-medium text-slate-400 font-mono">kg CO2e</span>
          </div>
          
          <p className={`text-sm max-w-md mx-auto leading-relaxed ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {currentTotalFootprint < FOOTPRINT_BENCHMARKS.nationalAverage ? (
              <span>Your lifestyle is running <span className="text-emerald-500 font-semibold">{Math.round((1 - currentTotalFootprint / FOOTPRINT_BENCHMARKS.nationalAverage) * 100)}% cleaner</span> than the average regional standard. Excellent progress.</span>
            ) : (
              <span>Your current footprint stands above the national average. Adopting even one micro-habit below can bring you back into balance.</span>
            )}
          </p>
        </div>

        {/* Delicate Comparative scale */}
        <div className="max-w-xl mx-auto pt-4 space-y-3">
          <div className={`relative h-1 rounded-full transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-slate-200'
          }`}>
            {/* Global Target Line */}
            <div 
              className={`absolute h-3 w-px -top-1 ${
                darkMode ? 'bg-slate-700' : 'bg-slate-300'
              }`}
              style={{ left: `${(FOOTPRINT_BENCHMARKS.globalAverage / 800) * 100}%` }}
            />
            {/* National average */}
            <div 
              className={`absolute h-3 w-px -top-1 ${
                darkMode ? 'bg-slate-700' : 'bg-slate-300'
              }`}
              style={{ left: `${(FOOTPRINT_BENCHMARKS.nationalAverage / 800) * 100}%` }}
            />
            
            {/* User Indicator Pin */}
            {(() => {
              const ratio = Math.min(95, Math.max(5, (currentTotalFootprint / 800) * 100));
              return (
                <div 
                  className={`absolute -top-1.5 w-4 h-4 bg-emerald-500 border-2 rounded-full shadow-sm -translate-x-1/2 transition-all duration-500 ${
                    darkMode ? 'border-slate-900' : 'border-white'
                  }`}
                  style={{ left: `${ratio}%` }}
                />
              );
            })()}
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider px-1">
            <span>Global Target ({FOOTPRINT_BENCHMARKS.globalAverage} kg)</span>
            <span>National Avg ({FOOTPRINT_BENCHMARKS.nationalAverage} kg)</span>
          </div>
        </div>

        {/* Mini total savings ticker */}
        {cumulativeSaved > 0 && (
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            darkMode 
              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-405 text-emerald-350' 
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span>Successfully spared {cumulativeSaved} kg CO2e in total history</span>
          </div>
        )}
      </div>

      {/* Insights Panel: Breakdown & Reduction Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        
        {/* Footprint Sector Breakdown */}
        <div className="space-y-6" id="card-breakdown">
          <div className="space-y-1">
            <h3 className={`text-xs uppercase font-extrabold tracking-widest font-mono ${
              darkMode ? 'text-slate-400' : 'text-slate-400'
            }`}>Sector Breakdown</h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your footprint distributed across daily categories.</p>
          </div>
          
          <div className="space-y-5">
            {categoriesMeta.map((cat) => {
              const percentage = footprint.total > 0 ? Math.round((cat.value / footprint.total) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-2" id={`breakdown-item-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-2 font-medium ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <span className="text-slate-405">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                    <div className="text-right text-xs text-slate-400 font-medium">
                      <span className={`font-semibold font-mono pr-2 ${
                        darkMode ? 'text-white' : 'text-slate-800'
                      }`}>{cat.value} kg</span>
                      <span>({percentage}%)</span>
                    </div>
                  </div>
                  
                  <div className={`w-full h-1.5 rounded-full overflow-hidden transition-colors ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  }`}>
                    <div 
                      className="h-full bg-emerald-500/80 rounded-full transition-all duration-750"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Climate Mitigation Curve (Mitigation Graph) */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className={`text-xs uppercase font-extrabold tracking-widest font-mono ${
              darkMode ? 'text-slate-400' : 'text-slate-400'
            }`}>Mitigation Curve</h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Weekly progress track of logs saved over time.</p>
          </div>

          <div className={`border rounded-2xl p-6 h-64 flex flex-col justify-between transition-colors duration-300 ${
            darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/40 border-slate-100'
          }`}>
            <div className="w-full h-full min-h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFootprint" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="name" 
                    stroke={darkMode ? "#94a3b8" : "#64748b"} 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={5}
                  />
                  <YAxis 
                    stroke={darkMode ? "#94a3b8" : "#64748b"} 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-5}
                    unit="kg"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#0f172a' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Footprint" 
                    name="Carbon Footprint"
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorFootprint)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Saved" 
                    name="Savings Done"
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSaved)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {logs.length <= 1 && (
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                Log weekly activities below to track your downward Carbon Trajectory path!
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Core Tasks Checklist / Logging Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pt-6">
        
        {/* Recommended Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-xs uppercase font-extrabold tracking-widest font-mono ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>Personalized Climate Actions</h3>
              {recsMode === 'fallback' ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Local Plan
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  AI Plan
                </span>
              )}
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Select specific habits adopted to log within your weekly check-in below.
            </p>
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">Synthesizing action plans from your profile...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-xl ${
              darkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <p className="text-xs text-slate-400">No climate suggestions registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3" id="actions-checklist">
              {recommendations.map((rec) => {
                const isSelected = selectedRecommendations.includes(rec.id);
                return (
                  <div
                    key={rec.id}
                    id={`action-item-${rec.id}`}
                    onClick={() => handleToggleAction(rec.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? darkMode
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-sm'
                          : 'border-emerald-500/80 bg-emerald-50/10 shadow-sm' 
                        : darkMode
                          ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/20'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/20'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-emerald-500 text-white' 
                            : darkMode
                              ? 'border border-slate-750 bg-slate-800'
                              : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                            {rec.category}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.impact} Impact
                          </span>
                        </div>
                        
                        <h4 className={`text-xs font-semibold ${
                          isSelected 
                            ? 'text-slate-400 line-through' 
                            : darkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {rec.action}
                        </h4>
                        
                        <p className={`text-xs leading-relaxed font-normal ${
                          darkMode ? 'text-slate-400' : 'text-slate-405'
                        }`}>
                          {rec.description}
                        </p>
                      </div>

                      <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${
                        darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        -{rec.savings} kg
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Action Board Submit Panel */}
              <div className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 transition-colors ${
                darkMode ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50'
              }`}>
                <div className="space-y-0.5">
                  <p className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Complete Weekly Mitigation Assessment</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Adopting {selectedRecommendations.length} active tasks this week.
                  </p>
                </div>
                
                <button
                  onClick={handleWeeklyCheckIn}
                  id="btn-weekly-submit-inline"
                  className={`px-5 py-2.5 font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer ${
                    darkMode 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-555' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Log Week {currentWeek} Activities
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Minimal Conversational AI Assistant */}
        <div className="lg:col-span-5 space-y-6" id="panel-coach">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-xs uppercase font-extrabold tracking-widest font-mono ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>Carbon Coach</h3>
              {coachMode === 'fallback' ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Local Mode
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  AI Mode
                </span>
              )}
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Dialogue directly configured to analyze your emission benchmarks.
            </p>
          </div>

          <div className={`border rounded-2xl p-5 space-y-4 flex flex-col h-[420px] shadow-sm justify-between transition-colors duration-300 ${
            darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
          }`}>
            {/* Scroll History */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin" id="coach-chat-history">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[90%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                >
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? darkMode
                        ? 'bg-emerald-900/25 text-emerald-300 border border-emerald-800/40 rounded-br-none'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-br-none' 
                      : darkMode
                        ? 'bg-slate-800/40 border border-slate-800/60 text-slate-300 rounded-bl-none'
                        : 'bg-slate-55 border border-slate-100 bg-slate-50/50 text-slate-750 rounded-bl-none'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              {isSendingMessage && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[10px] font-mono">Coach reading metrics...</span>
                </div>
              )}
            </div>

            {/* Form & Topic suggestions */}
            <div className={`space-y-3 pt-3 border-t ${darkMode ? 'border-slate-850' : 'border-slate-100'}`}>
              {/* Quick topics */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setChatInput("Why is my Food footprint high? Please give alternative habits.")}
                  className={`text-[10px] rounded-full px-2.5 py-1 transition cursor-pointer border ${
                    darkMode
                      ? 'text-slate-350 bg-slate-800 border-slate-750 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-800 bg-slate-55 border-slate-150'
                  }`}
                >
                  "Why is food high?"
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput("What is the single easiest sustainable change I can make starting today?")}
                  className={`text-[10px] rounded-full px-2.5 py-1 transition cursor-pointer border ${
                    darkMode
                      ? 'text-slate-350 bg-slate-800 border-slate-750 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-800 bg-slate-55 border-slate-150'
                  }`}
                >
                  "Easiest change?"
                </button>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your carbon coach..."
                  id="coach-chat-input"
                  className={`flex-1 p-2.5 border rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode 
                      ? 'bg-slate-950/70 text-slate-100 border-slate-800 focus:bg-slate-950 focus:ring-emerald-500/50' 
                      : 'bg-slate-50/50 text-slate-808 border-slate-150 focus:bg-white placeholder:text-slate-400'
                  }`}
                />
                
                <button
                  type="submit"
                  disabled={isSendingMessage || !chatInput.trim()}
                  id="coach-send-button"
                  className={`px-4 py-2.5 font-semibold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer ${
                    darkMode 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/10' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                  }`}
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
