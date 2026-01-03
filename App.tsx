
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, History, Activity, Info, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Cpu, RefreshCw } from 'lucide-react';
import { analyzePassword } from './services/strengthAnalyzer';
import { checkBreach } from './services/hibpService';
import { getSecurityAdvice } from './services/geminiService';
import { PasswordResult, AnalysisHistoryItem } from './types';

export default function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordResult | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!password) return;
    
    setIsAnalyzing(true);
    setAiAdvice('');
    
    const strength = analyzePassword(password);
    const pwnedCount = await checkBreach(password);
    
    const result: PasswordResult = {
      ...strength,
      pwnedCount,
      isPwned: pwnedCount > 0,
      timestamp: Date.now(),
      passwordLabel: `${password.slice(0, 1)}${'*'.repeat(Math.max(0, password.length - 2))}${password.slice(-1)}`
    };

    setAnalysis(result);
    
    // Update History
    const newHistoryItem: AnalysisHistoryItem = {
      ...result,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('sentinel_history', JSON.stringify(updatedHistory));

    setIsAnalyzing(false);

    // Get AI Advice
    setLoadingAdvice(true);
    const advice = await getSecurityAdvice(
      result.score,
      result.entropy,
      result.warning,
      result.suggestions,
      result.isPwned,
      result.pwnedCount
    );
    setAiAdvice(advice);
    setLoadingAdvice(false);
  }, [password, history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sentinel_history');
  };

  const scoreColors = [
    'bg-red-500',    // Very Weak
    'bg-orange-500', // Weak
    'bg-yellow-500', // Fair
    'bg-blue-500',   // Strong
    'bg-emerald-500' // Expert
  ];

  const scoreText = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Expert'
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sentinel</h1>
              <p className="text-slate-400 text-sm">Advanced Password Guardian</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>HIBP Integrated</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Input Section */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Analyze Password
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="Enter password to test security..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-5 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all mono text-lg"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!password || isAnalyzing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Run Diagnostic
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Results Section */}
            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strength Card */}
                  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Strength Score</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${analysis.score >= 3 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {scoreText[analysis.score]}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mb-6">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                            analysis.score > step ? scoreColors[analysis.score] : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Crack Time</p>
                        <p className="font-semibold text-slate-200">{analysis.crackTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Entropy</p>
                        <p className="font-semibold text-slate-200">{analysis.entropy.toFixed(1)} bits</p>
                      </div>
                    </div>
                  </div>

                  {/* Breach Status Card */}
                  <div className={`p-6 rounded-2xl border transition-all ${
                    analysis.isPwned 
                    ? 'bg-red-500/5 border-red-500/20 text-red-100' 
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {analysis.isPwned ? (
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      )}
                      <h3 className="font-semibold">Security Check</h3>
                    </div>
                    {analysis.isPwned ? (
                      <div>
                        <p className="text-sm opacity-80 mb-2">This password was found in data breaches!</p>
                        <p className="text-2xl font-bold">{analysis.pwnedCount?.toLocaleString()} occurrences</p>
                        <p className="text-xs mt-2 text-red-400 font-medium italic">Immediate action recommended: Change this password everywhere.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm opacity-80 mb-2">Clean record!</p>
                        <p className="text-2xl font-bold">0 Breaches</p>
                        <p className="text-xs mt-2 text-emerald-400 font-medium">This password hasn't been leaked in known databases.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Advice & Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Local Suggestions */}
                  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Improvements
                    </h3>
                    <ul className="space-y-3">
                      {analysis.warning && (
                        <li className="flex gap-3 text-sm text-red-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>{analysis.warning}</span>
                        </li>
                      )}
                      {analysis.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300 items-center">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                      {analysis.suggestions.length === 0 && !analysis.warning && (
                        <li className="text-sm text-slate-500 italic">No basic improvements needed.</li>
                      )}
                    </ul>
                  </div>

                  {/* AI Advice */}
                  <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Cpu className="w-16 h-16 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-medium text-indigo-400 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      AI Security Analyst
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                      {loadingAdvice ? (
                        <div className="flex flex-col gap-2">
                          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full"></div>
                          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
                          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-4/6"></div>
                        </div>
                      ) : (
                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {aiAdvice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden h-fit">
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-300 uppercase tracking-wider">
                  <History className="w-4 h-4 text-slate-400" />
                  Audit Logs
                </h2>
                <button 
                  onClick={clearHistory}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-700/30 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="mono text-indigo-400 text-sm font-medium">{item.passwordLabel}</span>
                        <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5 w-16">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${item.score > i ? scoreColors[item.score] : 'bg-slate-700'}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {item.isPwned ? (
                            <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase">
                              <ShieldAlert className="w-3 h-3" />
                              Pwned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                              <ShieldCheck className="w-3 h-3" />
                              Safe
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-slate-500">No previous logs found.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Quick Tips */}
            <section className="bg-indigo-600/10 border border-indigo-600/20 p-5 rounded-2xl">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Security Guide
              </h3>
              <ul className="text-xs text-slate-400 space-y-3">
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">01.</span>
                  Use passphrases with 4+ random words.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">02.</span>
                  Unique passwords for every single account.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">03.</span>
                  Enable Multi-Factor Authentication (MFA).
                </li>
              </ul>
            </section>
          </div>
        </main>

        <footer className="text-center py-10 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Sentinel utilizes SHA-1 k-Anonymity via HaveIBeenPwned. No raw passwords are sent to any API.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-[10px] text-slate-600 font-medium">
            <span>&copy; 2024 SENTINEL PROJECT</span>
            <span>PRIVACY FOCUSED</span>
            <span>AI ENHANCED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
