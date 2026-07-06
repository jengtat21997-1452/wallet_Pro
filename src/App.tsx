import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { getOrCreateSpreadsheet, fetchTransactions, addTransaction, Transaction } from './lib/sheets';
import { useTheme } from './components/ThemeProvider';
import { Moon, Sun, LogOut, Wallet, TrendingUp, TrendingDown, Plus, Loader2, PieChart as PieChartIcon, ExternalLink, ArrowLeft, History, PlusCircle, BarChart3, Home, Search, Filter, AlertCircle, Tags, Edit2, Trash2, Save, X, Sparkles, Activity, Lightbulb, Upload, FileImage, CheckCircle, Calendar, Utensils, Coffee, Car, ShoppingBag, Gift, Gamepad2, Heart, Coins, GraduationCap, Plane, Landmark, Zap, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type ViewState = 'home' | 'add' | 'history' | 'summary' | 'categories' | 'ai-checkup' | 'ai-budget' | 'saving-calendar';

export type CategoryDef = {
  id: string;
  name: string;
  type: 'income' | 'expense';
};

const defaultCategories: CategoryDef[] = [
  { id: '1', name: 'อาหาร', type: 'expense' },
  { id: '2', name: 'เดินทาง', type: 'expense' },
  { id: '3', name: 'ช้อปปิ้ง', type: 'expense' },
  { id: '4', name: 'ที่พัก', type: 'expense' },
  { id: '5', name: 'เงินเดือน', type: 'income' },
  { id: '6', name: 'โบนัส', type: 'income' },
];

const getCategoryVisuals = (categoryName: string, type: 'income' | 'expense') => {
  const name = (categoryName || '').trim().toLowerCase();
  
  if (name.includes('อาหาร') || name.includes('กิน') || name.includes('ฟาสต์ฟู้ด') || name.includes('ชาบู') || name.includes('บุฟเฟต์') || name.includes('food') || name.includes('dine') || name.includes('restaurant')) {
    return {
      color: 'orange',
      bgClass: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
      dotColor: 'bg-orange-500',
      icon: Utensils,
    };
  }
  if (name.includes('กาแฟ') || name.includes('เครื่องดื่ม') || name.includes('คาเฟ่') || name.includes('coffee') || name.includes('cafe') || name.includes('drink')) {
    return {
      color: 'amber',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
      dotColor: 'bg-amber-500',
      icon: Coffee,
    };
  }
  if (name.includes('เดินทาง') || name.includes('รถ') || name.includes('ขนส่ง') || name.includes('น้ำมัน') || name.includes('รถไฟฟ้า') || name.includes('taxi') || name.includes('travel') || name.includes('transport') || name.includes('car')) {
    return {
      color: 'sky',
      bgClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30',
      dotColor: 'bg-sky-500',
      icon: Car,
    };
  }
  if (name.includes('ช้อป') || name.includes('ซื้อของ') || name.includes('ห้าง') || name.includes('เสื้อผ้า') || name.includes('shopping') || name.includes('clothes')) {
    return {
      color: 'pink',
      bgClass: 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30',
      dotColor: 'bg-pink-500',
      icon: ShoppingBag,
    };
  }
  if (name.includes('ที่พัก') || name.includes('บ้าน') || name.includes('คอนโด') || name.includes('ค่าเช่า') || name.includes('หอพัก') || name.includes('home') || name.includes('house') || name.includes('accommodation') || name.includes('rent')) {
    return {
      color: 'indigo',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
      dotColor: 'bg-indigo-500',
      icon: Home,
    };
  }
  if (name.includes('เงินเดือน') || name.includes('รายได้') || name.includes('salary') || name.includes('income')) {
    return {
      color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      dotColor: 'bg-emerald-500',
      icon: Coins,
    };
  }
  if (name.includes('โบนัส') || name.includes('ของขวัญ') || name.includes('รางวัล') || name.includes('bonus') || name.includes('gift') || name.includes('reward')) {
    return {
      color: 'purple',
      bgClass: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
      dotColor: 'bg-purple-500',
      icon: Gift,
    };
  }
  if (name.includes('บันเทิง') || name.includes('เกม') || name.includes('ดูหนัง') || name.includes('คอนเสิร์ต') || name.includes('entertainment') || name.includes('game') || name.includes('movie')) {
    return {
      color: 'rose',
      bgClass: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
      dotColor: 'bg-rose-500',
      icon: Gamepad2,
    };
  }
  if (name.includes('สุขภาพ') || name.includes('หมอ') || name.includes('ยา') || name.includes('โรงพยาบาล') || name.includes('คลินิก') || name.includes('health') || name.includes('medical') || name.includes('doctor')) {
    return {
      color: 'red',
      bgClass: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30',
      dotColor: 'bg-red-500',
      icon: Heart,
    };
  }
  if (name.includes('น้ำ') || name.includes('ไฟ') || name.includes('เน็ต') || name.includes('สาธารณูปโภค') || name.includes('โทรศัพท์') || name.includes('utilities') || name.includes('electricity') || name.includes('water') || name.includes('internet')) {
    return {
      color: 'yellow',
      bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30',
      dotColor: 'bg-yellow-500',
      icon: Lightbulb,
    };
  }
  if (name.includes('เรียน') || name.includes('ศึกษา') || name.includes('หนังสือ') || name.includes('อบรม') || name.includes('education') || name.includes('book') || name.includes('study')) {
    return {
      color: 'cyan',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30',
      dotColor: 'bg-cyan-500',
      icon: GraduationCap,
    };
  }
  if (name.includes('เที่ยวต่างประเทศ') || name.includes('ตั๋วเครื่องบิน') || name.includes('โรงแรม') || name.includes('flight') || name.includes('hotel') || name.includes('vacation')) {
    return {
      color: 'teal',
      bgClass: 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30',
      dotColor: 'bg-teal-500',
      icon: Plane,
    };
  }
  if (name.includes('ลงทุน') || name.includes('หุ้น') || name.includes('กองทุน') || name.includes('ออม') || name.includes('saving') || name.includes('investment') || name.includes('stock')) {
    return {
      color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      dotColor: 'bg-emerald-500',
      icon: Landmark,
    };
  }

  const palettes = [
    { color: 'blue', bgClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30', dotColor: 'bg-blue-500', icon: Briefcase },
    { color: 'indigo', bgClass: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30', dotColor: 'bg-indigo-500', icon: Tags },
    { color: 'violet', bgClass: 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30', dotColor: 'bg-violet-500', icon: Sparkles },
    { color: 'fuchsia', bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-900/30', dotColor: 'bg-fuchsia-500', icon: Tags },
    { color: 'rose', bgClass: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30', dotColor: 'bg-rose-500', icon: Gamepad2 },
    { color: 'lime', bgClass: 'bg-lime-50 dark:bg-lime-950/20 text-lime-600 dark:text-lime-400 border-lime-100 dark:border-lime-900/30', dotColor: 'bg-lime-500', icon: Zap },
    { color: 'amber', bgClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30', dotColor: 'bg-amber-500', icon: Coins },
    { color: 'emerald', bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30', dotColor: 'bg-emerald-500', icon: Coins }
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  const selectedPalette = palettes[index];
  
  const defaultIcon = type === 'income' ? TrendingUp : TrendingDown;
  
  return {
    ...selectedPalette,
    icon: selectedPalette.icon || defaultIcon
  };
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [summaryMode, setSummaryMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Savings Calendar States
  const [calendarMonth, setCalendarMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  
  const { theme, toggleTheme } = useTheme();

  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyBudget, setDailyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('dailyBudget');
    return saved ? parseFloat(saved) : 0;
  });

  const [customCategories, setCustomCategories] = useState<CategoryDef[]>(() => {
    const saved = localStorage.getItem('customCategories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  // AI States
  const [isAnalyzingNote, setIsAnalyzingNote] = useState(false);
  const [noteAnalysisError, setNoteAnalysisError] = useState<string | null>(null);
  const [lastAnalyzedNote, setLastAnalyzedNote] = useState('');
  const [selectedTxForView, setSelectedTxForView] = useState<Transaction | null>(null);
  const [isAnalyzingTx, setIsAnalyzingTx] = useState(false);
  const [txAnalysis, setTxAnalysis] = useState<{ summary: string; tip: string } | null>(null);
  const [txAnalysisError, setTxAnalysisError] = useState<string | null>(null);

  // AI Checkup States
  const [isGeneratingCheckup, setIsGeneratingCheckup] = useState(false);
  const [checkupReport, setCheckupReport] = useState<{
    score: string;
    savingRate: number;
    statusText: string;
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    actionPlan: string[];
  } | null>(null);
  const [checkupError, setCheckupError] = useState<string | null>(null);

  // AI Budget States
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);
  const [budgetRecommendation, setBudgetRecommendation] = useState<{
    recommendedDailyBudget: number;
    recommendedMonthlyBudget: number;
    justification: string;
    savingsGoalPercent: number;
  } | null>(null);
  const [budgetRecError, setBudgetRecError] = useState<string | null>(null);

  // AI Slip Reader States
  const [isParsingSlip, setIsParsingSlip] = useState(false);
  const [slipParseError, setSlipParseError] = useState<string | null>(null);
  const [slipParseSuccessMessage, setSlipParseSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dailyBudget', dailyBudget.toString());
  }, [dailyBudget]);

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setNeedsAuth(false);
        loadSpreadsheetData();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setSpreadsheetId(null);
        setTransactions([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadSpreadsheetData = async () => {
    setIsLoadingData(true);
    try {
      const sid = await getOrCreateSpreadsheet();
      setSpreadsheetId(sid);
      const txs = await fetchTransactions(sid);
      setTransactions(txs);
    } catch (err) {
      console.error("Error loading spreadsheet data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await loadSpreadsheetData();
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newCategory: CategoryDef = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType,
    };
    setCustomCategories([...customCategories, newCategory]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
    setCustomCategories(customCategories.filter(c => c.id !== id));
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editCategoryName.trim()) return;
    setCustomCategories(customCategories.map(c => 
      c.id === id ? { ...c, name: editCategoryName.trim() } : c
    ));
    setEditingCategory(null);
  };

  const startEditCategory = (category: CategoryDef) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
  };

  const handleAIAnalyzeNote = async (noteText?: string) => {
    const textToAnalyze = (noteText || note).trim();
    if (!textToAnalyze) return;
    setIsAnalyzingNote(true);
    setNoteAnalysisError(null);
    setLastAnalyzedNote(textToAnalyze);
    try {
      const response = await fetch('/api/gemini/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: textToAnalyze, currentCategories: customCategories }),
      });
      if (!response.ok) {
        throw new Error('การวิเคราะห์ล้มเหลว โปรดลองอีกครั้ง');
      }
      const data = await response.json();
      if (data.category) {
        setCategory(data.category);
        setType(data.type as 'income' | 'expense');
        
        // Auto-add category if it doesn't exist
        const exists = customCategories.some(c => c.name.toLowerCase() === data.category.toLowerCase() && c.type === data.type);
        if (!exists) {
          const newCategory: CategoryDef = {
            id: Date.now().toString(),
            name: data.category,
            type: data.type as 'income' | 'expense',
          };
          setCustomCategories(prev => [...prev, newCategory]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setNoteAnalysisError(err.message || 'เกิดข้อผิดพลาดในการติดต่อ AI');
    } finally {
      setIsAnalyzingNote(false);
    }
  };

  useEffect(() => {
    const trimmed = note.trim();
    if (!trimmed || trimmed.length < 3 || trimmed === lastAnalyzedNote) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleAIAnalyzeNote(trimmed);
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [note, lastAnalyzedNote]);

  const handleViewTransaction = async (tx: Transaction) => {
    setSelectedTxForView(tx);
    setIsAnalyzingTx(true);
    setTxAnalysis(null);
    setTxAnalysisError(null);
    try {
      const response = await fetch('/api/gemini/summarize-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx }),
      });
      if (!response.ok) {
        throw new Error('การสรุปรายการล้มเหลว โปรดลองอีกครั้ง');
      }
      const data = await response.json();
      setTxAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setTxAnalysisError(err.message || 'เกิดข้อผิดพลาดในการติดต่อ AI');
    } finally {
      setIsAnalyzingTx(false);
    }
  };

  const handleGenerateCheckup = async () => {
    setIsGeneratingCheckup(true);
    setCheckupError(null);
    try {
      const response = await fetch('/api/gemini/monthly-checkup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      if (!response.ok) {
        throw new Error('ไม่สามารถวิเคราะห์สุขภาพทางการเงินได้ โปรดลองอีกครั้ง');
      }
      const data = await response.json();
      setCheckupReport(data);
    } catch (err: any) {
      console.error(err);
      setCheckupError(err.message || 'เกิดข้อผิดพลาดในการรับข้อมูลจาก AI');
    } finally {
      setIsGeneratingCheckup(false);
    }
  };

  const handleGenerateBudget = async () => {
    setIsGeneratingBudget(true);
    setBudgetRecError(null);
    try {
      const response = await fetch('/api/gemini/budget-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, currentDailyBudget: dailyBudget }),
      });
      if (!response.ok) {
        throw new Error('ไม่สามารถคำนวณงบประมาณแนะนำได้ โปรดลองอีกครั้ง');
      }
      const data = await response.json();
      setBudgetRecommendation(data);
    } catch (err: any) {
      console.error(err);
      setBudgetRecError(err.message || 'เกิดข้อผิดพลาดในการติดต่อ AI');
    } finally {
      setIsGeneratingBudget(false);
    }
  };

  const handleApplyRecommendedBudget = (amount: number) => {
    setDailyBudget(amount);
    alert(`ปรับงบประมาณรายวันเป็น ฿${amount.toLocaleString()} สำเร็จ!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSlipFile(file);
  };

  const processSlipFile = async (file: File) => {
    setIsParsingSlip(true);
    setSlipParseError(null);
    setSlipParseSuccessMessage(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const base64WithPrefix = await base64Promise;

      const response = await fetch('/api/gemini/parse-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: base64WithPrefix,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        throw new Error('ระบบไม่สามารถสกัดข้อมูลจากสลิปได้ โปรดลองอัปโหลดสลิปที่ชัดเจนกว่านี้');
      }

      const data = await response.json();
      if (data.amount !== undefined) {
        setAmount(data.amount.toString());
        setCategory(data.category || '');
        setNote(data.note || '');
        setType(data.type || 'expense');
        
        if (data.category) {
          const exists = customCategories.some(c => c.name.toLowerCase() === data.category.toLowerCase() && c.type === (data.type || 'expense'));
          if (!exists) {
            const newCategory: CategoryDef = {
              id: Date.now().toString(),
              name: data.category,
              type: (data.type || 'expense') as 'income' | 'expense'
            };
            setCustomCategories(prev => [...prev, newCategory]);
          }
        }
        setSlipParseSuccessMessage(`ดึงข้อมูลสลิปสำเร็จ! จำนวนเงิน ฿${data.amount.toLocaleString()} หมวดหมู่ "${data.category}"`);
      } else {
        throw new Error('ไม่พบข้อมูลจำนวนเงินโอนในสลิปนี้');
      }
    } catch (err: any) {
      console.error(err);
      setSlipParseError(err.message || 'เกิดข้อผิดพลาดในการอ่านสลิป');
    } finally {
      setIsParsingSlip(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId || !amount || !category) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const newTx = await addTransaction(spreadsheetId, {
        date: new Date().toISOString(),
        type,
        amount: parsedAmount,
        category,
        note
      });
      setTransactions(prev => [newTx, ...prev]);
      setAmount('');
      setCategory('');
      setNote('');
    } catch (err) {
      console.error("Error adding transaction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableMonths = Array.from(new Set([
    ...transactions.map(t => t.date ? format(new Date(t.date), 'yyyy-MM') : format(new Date(), 'yyyy-MM')),
    format(new Date(), 'yyyy-MM')
  ])).sort().reverse();

  const availableYears = Array.from(new Set([
    ...transactions.map(t => t.date ? format(new Date(t.date), 'yyyy') : format(new Date(), 'yyyy')),
    format(new Date(), 'yyyy')
  ])).sort().reverse();

  const currentSummaryTransactions = transactions.filter(t => {
    if (!t.date) return false;
    if (summaryMode === 'month') {
      return format(new Date(t.date), 'yyyy-MM') === selectedMonth;
    } else {
      return format(new Date(t.date), 'yyyy') === selectedYear;
    }
  });

  const totalIncome = currentSummaryTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentSummaryTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Savings Calendar Helpers & Calculations
  const [calendarYearStr, calendarMonthStr] = calendarMonth.split('-');
  const calendarYear = parseInt(calendarYearStr);
  const calendarMonthNum = parseInt(calendarMonthStr);

  const calendarDaysInMonth = new Date(calendarYear, calendarMonthNum, 0).getDate();
  const calendarStartDayOfWeek = new Date(calendarYear, calendarMonthNum - 1, 1).getDay();

  // Transactions of this calendar month
  const calendarMonthTxs = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      try {
        return format(new Date(t.date), 'yyyy-MM') === calendarMonth;
      } catch {
        return false;
      }
    });
  }, [transactions, calendarMonth]);

  const calendarMonthIncome = useMemo(() => {
    return calendarMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [calendarMonthTxs]);

  const calendarMonthExpense = useMemo(() => {
    return calendarMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [calendarMonthTxs]);

  const calendarMonthSavings = calendarMonthIncome - calendarMonthExpense;

  // Calculate successful saving days (where expense <= dailyBudget, if there is expense)
  const calendarSavingsStats = useMemo(() => {
    let successDays = 0;
    let daysWithExpense = 0;
    for (let d = 1; d <= calendarDaysInMonth; d++) {
      const dayStr = `${calendarYearStr}-${calendarMonthStr}-${d.toString().padStart(2, '0')}`;
      const dayTxs = calendarMonthTxs.filter(t => {
        if (!t.date) return false;
        try {
          return format(new Date(t.date), 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      });
      const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      if (dayExpense > 0) {
        daysWithExpense++;
        if (dailyBudget > 0 && dayExpense <= dailyBudget) {
          successDays++;
        }
      }
    }
    return { successDays, daysWithExpense };
  }, [calendarMonthTxs, calendarDaysInMonth, calendarYearStr, calendarMonthStr, dailyBudget]);

  const selectedDayTxs = useMemo(() => {
    if (!selectedCalendarDay) return [];
    return transactions.filter(t => {
      if (!t.date) return false;
      try {
        return format(new Date(t.date), 'yyyy-MM-dd') === selectedCalendarDay;
      } catch {
        return false;
      }
    });
  }, [transactions, selectedCalendarDay]);

  const selectedDayIncome = useMemo(() => {
    return selectedDayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDayTxs]);

  const selectedDayExpense = useMemo(() => {
    return selectedDayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDayTxs]);

  const selectedDaySavings = selectedDayIncome - selectedDayExpense;

  const handlePrevMonth = () => {
    const [yStr, mStr] = calendarMonth.split('-');
    let y = parseInt(yStr);
    let m = parseInt(mStr);
    m--;
    if (m === 0) {
      m = 12;
      y--;
    }
    setCalendarMonth(`${y}-${m.toString().padStart(2, '0')}`);
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = calendarMonth.split('-');
    let y = parseInt(yStr);
    let m = parseInt(mStr);
    m++;
    if (m === 13) {
      m = 1;
      y++;
    }
    setCalendarMonth(`${y}-${m.toString().padStart(2, '0')}`);
    setSelectedCalendarDay(null);
  };

  const getThaiMonthName = (monthStr: string) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const idx = parseInt(monthStr) - 1;
    return months[idx] || '';
  };

  const comparisonData = useMemo(() => {
    if (summaryMode === 'month') {
      const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
      const data = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
        const dayTxs = currentSummaryTransactions.filter(t => t.date && t.date.startsWith(dayStr));
        const income = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        if (income > 0 || expense > 0) {
          data.push({ name: `${i}`, รายรับ: income, รายจ่าย: expense });
        }
      }
      return data.length > 0 ? data : [{ name: 'ไม่มีข้อมูล', รายรับ: 0, รายจ่าย: 0 }];
    } else {
      const data = [];
      for (let i = 1; i <= 12; i++) {
        const monthStr = `${selectedYear}-${i.toString().padStart(2, '0')}`;
        const monthTxs = currentSummaryTransactions.filter(t => t.date && t.date.startsWith(monthStr));
        const income = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        data.push({ name: format(new Date(parseInt(selectedYear), i - 1), 'MMM'), รายรับ: income, รายจ่าย: expense });
      }
      return data;
    }
  }, [currentSummaryTransactions, summaryMode, selectedMonth, selectedYear]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayExpenses = transactions
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(todayStr))
    .reduce((acc, t) => acc + t.amount, 0);

  const isOverBudget = dailyBudget > 0 && todayExpenses > dailyBudget;

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black transition-colors">
        <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl text-center border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-2">WALLET<span className="text-orange-500">PRO</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">บันทึกข้อมูลอัตโนมัติไปยัง Google Sheets ของคุณ</p>
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-colors tracking-widest disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 48 48" className="w-6 h-6">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            SIGN IN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors text-zinc-900 dark:text-white font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 h-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-10 flex items-center justify-between transition-colors">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center rotate-3">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">WALLET<span className="text-orange-500">PRO</span></h1>
          </div>
          <div className="flex items-center gap-6">
            {spreadsheetId && (
              <a 
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors rounded-full group cursor-pointer"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">ทางลัด Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
              </a>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-full"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoadingData && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">กำลังเชื่อมต่อ Google Sheets...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentView !== 'home' && (
              <button 
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าหลัก
              </button>
            )}

            {currentView === 'home' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button 
                  onClick={() => setCurrentView('add')}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">บันทึกรายการ</h3>
                  <p className="text-xs text-zinc-400 text-center">จดบันทึกรายรับ-รายจ่ายด่วน พร้อมระบบวิเคราะห์บันทึกและอ่านสลิปอัตโนมัติ</p>
                </button>

                <button 
                  onClick={() => setCurrentView('history')}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">ประวัติรายการ</h3>
                  <p className="text-xs text-zinc-400 text-center">ดูรายการย้อนหลัง ค้นหา และวิเคราะห์ข้อมูลธุรกรรมรายรายการด้วย AI</p>
                </button>

                <button 
                  onClick={() => setCurrentView('summary')}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">สรุปยอดเงิน & แผนภูมิ</h3>
                  <p className="text-xs text-zinc-400 text-center">รายงานรายรับ-รายจ่าย สัดส่วนหมวดหมู่ และวิเคราะห์แนวโน้มรายเดือน</p>
                </button>

                {/* AI Monthly Checkup button */}
                <button 
                  onClick={() => {
                    setCurrentView('ai-checkup');
                    if (!checkupReport) {
                      handleGenerateCheckup();
                    }
                  }}
                  className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 dark:from-pink-950/20 dark:to-purple-950/20 border border-pink-100 dark:border-pink-900/40 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-pink-500 dark:hover:border-pink-500 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] text-white font-bold rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI Insight
                  </div>
                  <div className="w-16 h-16 bg-pink-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">AI ตรวจสุขภาพการเงิน</h3>
                  <p className="text-xs text-zinc-400 text-center">วิเคราะห์แนวโน้ม ประเมินคะแนนพฤติกรรมการเงิน พร้อมจัดทำแผนปฏิบัติการอัจฉริยะ</p>
                </button>

                {/* AI Budget Recommendation button */}
                <button 
                  onClick={() => {
                    setCurrentView('ai-budget');
                    if (!budgetRecommendation) {
                      handleGenerateBudget();
                    }
                  }}
                  className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/40 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] text-white font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Smart
                  </div>
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">AI แนะนำการตั้งงบประมาณ</h3>
                  <p className="text-xs text-zinc-400 text-center">คำนวณงบประมาณรายวันและรายเดือนที่เหมาะสม พร้อมเหตุผลทางเศรษฐศาสตร์เพื่อเงินออม</p>
                </button>

                <button 
                  onClick={() => setCurrentView('saving-calendar')}
                  className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] text-white font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Tracker
                  </div>
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">ปฏิทินการออม</h3>
                  <p className="text-xs text-zinc-400 text-center">ดูสถิติออมเงินรายวัน ผลวินัยคุมงบประมาณ พร้อมกดดูรายละเอียดธุรกรรมแต่ละวันได้โดยตรง</p>
                </button>

                <button 
                  onClick={() => setCurrentView('categories')}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Tags className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">จัดการหมวดหมู่</h3>
                  <p className="text-xs text-zinc-400 text-center">ปรับแต่ง เพิ่ม หรือแก้ไขชื่อหมวดหมู่สำหรับการจำแนกรายรับและรายจ่ายส่วนตัว</p>
                </button>
              </div>
            )}

            {currentView === 'summary' && (
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold">สรุปยอดเงิน</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        onClick={() => setSummaryMode('month')}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", summaryMode === 'month' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}
                      >
                        รายเดือน
                      </button>
                      <button
                        onClick={() => setSummaryMode('year')}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", summaryMode === 'year' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}
                      >
                        รายปี
                      </button>
                    </div>

                    {summaryMode === 'month' ? (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-2 outline-none font-medium text-sm shadow-sm"
                      >
                        {availableMonths.map(monthStr => {
                          const [year, month] = monthStr.split('-');
                          const date = new Date(parseInt(year), parseInt(month) - 1);
                          return (
                            <option key={monthStr} value={monthStr}>
                              {format(date, 'MMMM yyyy')}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-2 outline-none font-medium text-sm shadow-sm"
                      >
                        {availableYears.map(yearStr => (
                          <option key={yearStr} value={yearStr}>
                            {yearStr}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {spreadsheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">เปิด Google Sheets</span>
                        <span className="sm:hidden">Sheets</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wallet className="w-16 h-16 text-zinc-900 dark:text-white" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest mb-1">ยอดเงินคงเหลือ</p>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white">
                      ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="mt-4 flex items-center text-blue-500 text-xs font-bold">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      อัปเดตล่าสุด
                    </div>
                  </div>

                  <div className="bg-blue-600 p-6 rounded-3xl">
                    <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">รายรับรวม</p>
                    <h2 className="text-4xl font-black text-white">
                      ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="mt-4 h-1 w-full bg-blue-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-3/4"></div>
                    </div>
                  </div>

                  <div className="bg-orange-500 p-6 rounded-3xl">
                    <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-1">รายจ่ายรวม</p>
                    <h2 className="text-4xl font-black text-white">
                      ฿{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="mt-4 h-1 w-full bg-orange-700 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-1/3"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">งบประมาณรายวัน</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">ตั้งค่างบประมาณเพื่อรับการแจ้งเตือนเมื่อใช้จ่ายเกิน</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold">฿</span>
                    <input 
                      type="number" 
                      value={dailyBudget || ''}
                      onChange={(e) => setDailyBudget(Number(e.target.value))}
                      placeholder="เช่น 500"
                      className="w-32 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                {(totalIncome > 0 || totalExpense > 0) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      เปรียบเทียบรายรับ-รายจ่าย
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#3f3f46' : '#e4e4e7'} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 12 }}
                            tickFormatter={(value) => `฿${value}`}
                          />
                          <Tooltip
                            cursor={{ fill: theme === 'dark' ? '#27272a' : '#f4f4f5' }}
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '1rem', color: theme === 'dark' ? '#ffffff' : '#000000' }}
                            itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                            formatter={(value: number) => `฿${value.toLocaleString()}`}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="รายรับ" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="รายจ่าย" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'add' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col">
                  <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-2 h-6 bg-orange-500 mr-3 rounded-full"></span>
                      บันทึกรายการใหม่
                    </span>
                    <span className="text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-Fill
                    </span>
                  </h3>

                  {/* AI Slip Reader Zone */}
                  <div className="mb-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-black/10 hover:bg-orange-50/20 dark:hover:bg-orange-950/5 hover:border-orange-300 dark:hover:border-orange-900/60 transition-all relative overflow-hidden group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={isParsingSlip}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                      title="อัปโหลดสลิปธนาคารเพื่อกรอกข้อมูลด่วน"
                    />
                    <div className="p-6 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-xs flex items-center justify-center text-orange-500 mb-3 group-hover:scale-110 transition-transform">
                        {isParsingSlip ? (
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-center">
                        สแกนสลิปโอนเงินอัจฉริยะ (AI Slip Reader)
                      </h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">
                        {isParsingSlip 
                          ? 'กำลังอ่านภาพสลิปและสกัดข้อมูลทางการเงินด้วย Gemini...' 
                          : 'ลากไฟล์สลิปมาวาง หรือคลิกเพื่ออัปโหลดรูปภาพสลิปเพื่อกรอกข้อมูลอัตโนมัติ'
                        }
                      </p>

                      {slipParseSuccessMessage && (
                        <div className="mt-4 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-xs flex items-center gap-2 max-w-md animate-in zoom-in-95 font-semibold text-center justify-center">
                          <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
                          <span>{slipParseSuccessMessage}</span>
                        </div>
                      )}

                      {slipParseError && (
                        <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 max-w-md animate-in zoom-in-95 font-semibold text-center justify-center">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{slipParseError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase block mb-2">ประเภท</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                          className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
                        >
                          <option value="expense">รายจ่าย</option>
                          <option value="income">รายรับ</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">จำนวนเงิน (บาท)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:border-orange-500 outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">ชื่อรายการ / หมวดหมู่</label>
                      <input
                        type="text"
                        required
                        list="categories-list"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:border-orange-500 outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                        placeholder={type === 'expense' ? "เลือกหรือพิมพ์หมวดหมู่..." : "เลือกหรือพิมพ์หมวดหมู่..."}
                      />
                      <datalist id="categories-list">
                        {customCategories.filter(c => c.type === type).map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>

                      {/* Color-coded category chips for quick selection */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {customCategories.filter(c => c.type === type).slice(0, 10).map(c => {
                          const visuals = getCategoryVisuals(c.name, c.type);
                          const VisualIcon = visuals.icon;
                          const isSelected = category === c.name;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategory(c.name)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs",
                                isSelected
                                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent scale-102 font-bold shadow-md"
                                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                isSelected ? "bg-white/20 text-white" : visuals.bgClass
                              )}>
                                <VisualIcon className="w-2.5 h-2.5" />
                              </div>
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">บันทึกช่วยจำ (ตัวเลือก)</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          onBlur={() => {
                            const trimmed = note.trim();
                            if (trimmed && trimmed.length >= 3 && trimmed !== lastAnalyzedNote) {
                              handleAIAnalyzeNote(trimmed);
                            }
                          }}
                          className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl pl-4 pr-12 py-3 text-zinc-900 dark:text-white focus:border-orange-500 outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-700 font-medium"
                          placeholder="เช่น หมูกระทะกับเพื่อน, ได้เงินเดือนรอบแรก"
                        />
                        <div className="absolute right-3 flex items-center justify-center">
                          {isAnalyzingNote ? (
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                          )}
                        </div>
                      </div>

                      {isAnalyzingNote && (
                        <p className="text-xs text-orange-500 font-semibold mt-1.5 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                          Gemini AI กำลังวิเคราะห์จัดหมวดหมู่อัตโนมัติ...
                        </p>
                      )}
                      {noteAnalysisError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {noteAnalysisError}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                        * ระบบจะวิเคราะห์หมวดหมู่และแยก รายรับ/รายจ่าย ให้ทันทีแบบอัตโนมัติเมื่อพิมพ์เสร็จ โดยไม่ต้องกดปุ่มใดๆ
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !spreadsheetId}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-colors uppercase tracking-widest mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลอัตโนมัติ"}
                    </button>
                    {!spreadsheetId && !isLoadingData && (
                      <p className="text-xs text-red-500 text-center mt-2">โปรดรอการเชื่อมต่อ Google Sheets</p>
                    )}
                  </form>
                </div>
              </div>
            )}

            {currentView === 'history' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden min-h-[500px]">
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      ประวัติรายการทั้งหมด
                      {isLoadingData && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder="ค้นหารายการ..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-orange-500 transition-colors w-full sm:w-64"
                        />
                      </div>
                      
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                        className="px-4 py-2 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="income">รายรับ</option>
                        <option value="expense">รายจ่าย</option>
                      </select>
                    </div>
                  </div>
                  
                  {filteredTransactions.length === 0 && !isLoadingData ? (
                    <div className="text-center py-20 text-zinc-500 dark:text-zinc-400 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 opacity-50" />
                      </div>
                      <p>ไม่พบรายการที่ค้นหา</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-6">
                      {filteredTransactions.map((tx, idx) => (
                        <div 
                          key={tx.id || idx} 
                          onClick={() => handleViewTransaction(tx)}
                          className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-4 -mx-4 rounded-2xl cursor-pointer transition-all duration-200 group"
                          title="คลิกเพื่อดูสรุปและคำแนะนำทางการเงินจาก AI"
                        >
                          <div className="flex items-center gap-4">
                            {(() => {
                              const visuals = getCategoryVisuals(tx.category, tx.type);
                              const VisualIcon = visuals.icon;
                              return (
                                <div className="relative shrink-0">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                                    visuals.bgClass
                                  )}>
                                    <VisualIcon className="w-5 h-5" />
                                  </div>
                                  <span className={cn(
                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-extrabold text-white shadow-xs",
                                    tx.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                                  )} title={tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}>
                                    {tx.type === 'income' ? '+' : '-'}
                                  </span>
                                </div>
                              );
                            })()}
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white">{tx.category}</p>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                <span>{tx.date ? format(new Date(tx.date), 'dd MMM yyyy, HH:mm') : '-'}</span>
                                {tx.note && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[150px] sm:max-w-[300px]">{tx.note}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={cn(
                              "font-black text-right whitespace-nowrap",
                              tx.type === 'income' ? "text-blue-500" : "text-orange-500"
                            )}>
                              {tx.type === 'income' ? '+ ' : '- '}
                              {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <Sparkles className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {spreadsheetId && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Auto-Sync with Google Sheets is Live</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'categories' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <span className="w-2 h-6 bg-purple-500 mr-3 rounded-full"></span>
                    จัดการหมวดหมู่ที่ใช้บ่อย
                  </h3>

                  <form onSubmit={handleAddCategory} className="mb-8 flex flex-col sm:flex-row gap-4">
                    <select
                      value={newCategoryType}
                      onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                      className="bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium outline-none shrink-0"
                    >
                      <option value="expense">รายจ่าย</option>
                      <option value="income">รายรับ</option>
                    </select>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="เพิ่มหมวดหมู่ใหม่..."
                      className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-orange-500 mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <TrendingDown className="w-4 h-4" />
                        รายจ่าย
                      </h4>
                      <ul className="space-y-3">
                        {customCategories.filter(c => c.type === 'expense').map(cat => (
                          <li key={cat.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 px-4 py-3 rounded-xl">
                            {editingCategory === cat.id ? (
                              <div className="flex items-center gap-2 flex-1 w-full">
                                <input
                                  type="text"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  className="flex-1 min-w-0 bg-white dark:bg-black border border-purple-500 rounded px-2 py-1 text-sm outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveEditCategory(cat.id)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingCategory(null)} className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {(() => {
                                    const visuals = getCategoryVisuals(cat.name, 'expense');
                                    const VisualIcon = visuals.icon;
                                    return (
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", visuals.bgClass)}>
                                        <VisualIcon className="w-4 h-4" />
                                      </div>
                                    );
                                  })()}
                                  <span className="font-medium text-sm truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => startEditCategory(cat)} className="p-1.5 text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                        {customCategories.filter(c => c.type === 'expense').length === 0 && (
                          <li className="text-sm text-zinc-500 text-center py-4">ไม่มีหมวดหมู่</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-blue-500 mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <TrendingUp className="w-4 h-4" />
                        รายรับ
                      </h4>
                      <ul className="space-y-3">
                        {customCategories.filter(c => c.type === 'income').map(cat => (
                          <li key={cat.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 px-4 py-3 rounded-xl">
                            {editingCategory === cat.id ? (
                              <div className="flex items-center gap-2 flex-1 w-full">
                                <input
                                  type="text"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  className="flex-1 min-w-0 bg-white dark:bg-black border border-purple-500 rounded px-2 py-1 text-sm outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveEditCategory(cat.id)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingCategory(null)} className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {(() => {
                                    const visuals = getCategoryVisuals(cat.name, 'income');
                                    const VisualIcon = visuals.icon;
                                    return (
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", visuals.bgClass)}>
                                        <VisualIcon className="w-4 h-4" />
                                      </div>
                                    );
                                  })()}
                                  <span className="font-medium text-sm truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => startEditCategory(cat)} className="p-1.5 text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                        {customCategories.filter(c => c.type === 'income').length === 0 && (
                          <li className="text-sm text-zinc-500 text-center py-4">ไม่มีหมวดหมู่</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'ai-checkup' && (
              <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center">
                        <span className="w-2.5 h-6 bg-pink-500 mr-3 rounded-full"></span>
                        AI ตรวจสุขภาพทางการเงินรายเดือน
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">ประเมินวินัย วิเคราะห์อัตราการออม และจัดทำแผนออมเงินเฉพาะตัวคุณโดยละเอียด</p>
                    </div>
                    <button 
                      onClick={handleGenerateCheckup}
                      disabled={isGeneratingCheckup}
                      className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      {isGeneratingCheckup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{checkupReport ? 'วิเคราะห์ข้อมูลใหม่อีกครั้ง' : 'เริ่มตรวจสุขภาพการเงิน'}</span>
                    </button>
                  </div>

                  {isGeneratingCheckup ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg">กำลังประมวลผลธุรกรรมทั้งหมด...</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Gemini AI กำลังคำนวณอัตราการออม จับคู่ประเภทค่าใช้จ่าย และร่างแผนปรับปรุงให้คุณ</p>
                      </div>
                    </div>
                  ) : checkupError ? (
                    <div className="py-12 text-center max-w-md mx-auto">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">วิเคราะห์ข้อมูลล้มเหลว</h4>
                      <p className="text-xs text-zinc-500 mb-4">{checkupError}</p>
                      <button onClick={handleGenerateCheckup} className="text-sm font-bold text-pink-500 hover:underline">ลองอีกครั้ง</button>
                    </div>
                  ) : checkupReport ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Overall Grade Card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-pink-500/5 to-purple-500/5 dark:from-pink-950/20 dark:to-purple-950/20 border border-pink-100/50 dark:border-pink-900/20 rounded-2xl p-6">
                        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-200/40 dark:border-zinc-800/40">
                          <span className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-1">เกรดการเงินของคุณ</span>
                          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{checkupReport.score}</div>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-2 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-900/30">
                            {checkupReport.statusText}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-200/40 dark:border-zinc-800/40">
                          <span className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">อัตราการออมเงิน</span>
                          <div className="text-4xl font-black text-zinc-800 dark:text-white">{checkupReport.savingRate}%</div>
                          <p className="text-[10px] text-zinc-500 mt-2">คำนวณจากรายออมเปรียบเทียบกับรายได้ทั้งหมด</p>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">สุขภาพโดยรวม</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            {parseFloat(checkupReport.savingRate.toString()) >= 20 ? (
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : parseFloat(checkupReport.savingRate.toString()) > 0 ? (
                              <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
                            ) : (
                              <AlertCircle className="w-8 h-8 text-red-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-3 text-center">
                            {parseFloat(checkupReport.savingRate.toString()) >= 20 ? 'สัดส่วนสมบูรณ์ตามเกณฑ์ออมดีเยี่ยม' : 'ควรเร่งสกัดค่าใช้จ่ายฟุ่มเฟือยเพื่อเงินเก็บ'}
                          </p>
                        </div>
                      </div>

                      {/* Depth Analysis */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">บทวิเคราะห์โดยละเอียด</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-line">{checkupReport.analysis}</p>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="bg-green-50/20 dark:bg-green-950/10 border border-green-100/50 dark:border-green-900/20 rounded-2xl p-6">
                          <h4 className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2 mb-4">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            พฤติกรรมเด่น / ข้อดีเดือนนี้
                          </h4>
                          <ul className="space-y-3">
                            {checkupReport.strengths.map((item, index) => (
                              <li key={index} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 rounded-2xl p-6">
                          <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            จุดสังเกต / ควรระวังและปรับปรุง
                          </h4>
                          <ul className="space-y-3">
                            {checkupReport.weaknesses.map((item, index) => (
                              <li key={index} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Plan */}
                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          แผนปฏิบัติการ 3 ข้อแนะนำทางการเงินในเดือนถัดไป
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {checkupReport.actionPlan.map((plan, idx) => (
                            <div key={idx} className="bg-white dark:bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl shadow-xs relative">
                              <span className="absolute -top-3 left-4 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                {idx + 1}
                              </span>
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-2 leading-relaxed">
                                {plan}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center max-w-sm mx-auto flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-pink-50 dark:bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">พร้อมรับใบรายงานผลการเงินหรือยัง?</h4>
                      <p className="text-xs text-zinc-500 mb-6">ระบบจะรวบรวมพฤติกรรมการจ่ายและเงินเหลือออม แล้วให้ AI สรุปรายงานพร้อมวิเคราะห์จุดแข็ง-จุดปรับปรุงให้ทันที</p>
                      <button 
                        onClick={handleGenerateCheckup}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        กดเริ่มตรวจรายงาน
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'ai-budget' && (
              <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center">
                        <span className="w-2.5 h-6 bg-amber-500 mr-3 rounded-full"></span>
                        AI คำนวณขีดจำกัดและแผนงบประมาณอัจฉริยะ
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">เปรียบเทียบพฤติกรรมการใช้จ่ายกับหลักเศรษฐศาสตร์เพื่อเสนอเพดานงบประมาณที่เหมาะสม</p>
                    </div>
                    <button 
                      onClick={handleGenerateBudget}
                      disabled={isGeneratingBudget}
                      className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      {isGeneratingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{budgetRecommendation ? 'คำนวณงบประมาณใหม่' : 'เริ่มคำนวณแผน'}</span>
                    </button>
                  </div>

                  {isGeneratingBudget ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg">กำลังวางแผนงบประมาณที่ดีที่สุด...</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Gemini AI กำลังวิเคราะห์งบเดิมและหาแนวทางเพิ่มกระแสเงินสดให้คุณสูงสุด</p>
                      </div>
                    </div>
                  ) : budgetRecError ? (
                    <div className="py-12 text-center max-w-md mx-auto">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">คำนวณข้อมูลล้มเหลว</h4>
                      <p className="text-xs text-zinc-500 mb-4">{budgetRecError}</p>
                      <button onClick={handleGenerateBudget} className="text-sm font-bold text-amber-500 hover:underline">ลองอีกครั้ง</button>
                    </div>
                  ) : budgetRecommendation ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Recommendations Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily budget suggestion */}
                        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">งบรายวันแนะนำ (Daily Budget)</span>
                            <div className="text-4xl font-black text-zinc-900 dark:text-white">฿{budgetRecommendation.recommendedDailyBudget.toLocaleString()}</div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">เหมาะสำหรับการคุมค่ากิน ค่าเดินทาง และสินค้าเบ็ดเตล็ดในแต่ละวัน</p>
                          </div>
                          <button 
                            onClick={() => handleApplyRecommendedBudget(budgetRecommendation.recommendedDailyBudget)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors mt-6 cursor-pointer"
                          >
                            ยอมรับและตั้งงบประมาณนี้เลย
                          </button>
                        </div>

                        {/* Monthly budget suggestion */}
                        <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-6 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">งบรายเดือนแนะนำ (Monthly Budget)</span>
                            <div className="text-4xl font-black text-zinc-900 dark:text-white">฿{budgetRecommendation.recommendedMonthlyBudget.toLocaleString()}</div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">รวมขีดจำกัดการใช้สอยทั้งหมด (จำเป็น + ตามใจตัวเอง) ไม่รวมเงินเก็บออม</p>
                          </div>
                          <div className="mt-6 p-2 bg-purple-500/10 rounded-xl text-center">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">เป้าหมายเงินออม: {budgetRecommendation.savingsGoalPercent}% ของรายได้</span>
                          </div>
                        </div>
                      </div>

                      {/* Justification advice */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">คำแนะนำและเหตุผลทางงบประมาณ</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-line">{budgetRecommendation.justification}</p>
                        </div>
                      </div>

                      {/* Informational advice */}
                      <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 flex gap-3.5 items-start">
                        <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase">หลักสูตร 50/30/20 Rule อ้างอิง</h5>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            AI แนะนำตามโครงสร้างที่ดีที่สุด: แบ่งรายได้ออกเป็น 50% สำหรับค่าใช้จ่ายจำเป็น (Needs), 30% สำหรับค่าใช้จ่ายตามความชอบ (Wants), และ 20% สำหรับฝากออมสร้างอนาคต (Savings)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center max-w-sm mx-auto flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                        <Lightbulb className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">ค้นหาแนวทางตั้งงบประมาณที่ดีที่สุด</h4>
                      <p className="text-xs text-zinc-500 mb-6">ให้ Gemini คำนวณโควตาการกิน-อยู่รายวันแบบไม่ให้เป็นภาระชีวิต โดยวิเคราะห์อ้างอิงจากรายรับและค่าเฉลี่ยรายจ่ายจริงของคุณ</p>
                      <button 
                        onClick={handleGenerateBudget}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        กดคำนวณงบประมาณ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'saving-calendar' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center">
                      <span className="w-2.5 h-6 bg-emerald-500 mr-3 rounded-full"></span>
                      ปฏิทินการออมรายวัน
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1">คอยเช็กพฤติกรรมการใช้จ่ายและวินัยการออมเพื่อความยั่งยืนทางการเงินของคุณ</p>
                  </div>
                  
                  {/* Month navigation controls */}
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-xs">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all font-bold text-sm cursor-pointer"
                    >
                      &larr;
                    </button>
                    <span className="text-sm font-bold px-4 text-zinc-800 dark:text-zinc-200">
                      {getThaiMonthName(calendarMonthStr)} {parseInt(calendarYearStr) + 543}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all font-bold text-sm cursor-pointer"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* Dashboard / Month analysis widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ออมสำเร็จ (วันใต้งบรายวัน)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-zinc-900 dark:text-white">{calendarSavingsStats.successDays}</span>
                      <span className="text-xs text-zinc-400">/ {calendarSavingsStats.daysWithExpense} วันที่มีค่าใช้จ่าย</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${calendarSavingsStats.daysWithExpense > 0 ? (calendarSavingsStats.successDays / calendarSavingsStats.daysWithExpense) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">ยอดเก็บสะสมเดือนนี้</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn(
                        "text-2xl font-black",
                        calendarMonthSavings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                      )}>
                        {calendarMonthSavings >= 0 ? '+' : ''}฿{calendarMonthSavings.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-2">คำนวณจากรายรับหักลบรายจ่ายรวม</span>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100/50 dark:border-purple-900/30 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">ค่าใช้จ่ายรายวันเฉลี่ย</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-zinc-900 dark:text-white">฿{Math.round(calendarMonthExpense / calendarDaysInMonth).toLocaleString()}</span>
                      <span className="text-xs text-zinc-400">/ วัน</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-2">ยอดจ่ายรวมของทั้งเดือนหารด้วยจำนวนวัน</span>
                  </div>
                </div>

                {/* Calendar Layout and Details Split Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Calendar main Card */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-zinc-500">
                      <div className="text-red-500">อา.</div>
                      <div>จ.</div>
                      <div>อ.</div>
                      <div>พ.</div>
                      <div>พฤ.</div>
                      <div>ศ.</div>
                      <div className="text-blue-500">ส.</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {Array.from({ length: calendarStartDayOfWeek }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="aspect-square bg-zinc-50/50 dark:bg-zinc-800/10 border border-transparent rounded-2xl"></div>
                      ))}
                      {Array.from({ length: calendarDaysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dayStr = `${calendarYearStr}-${calendarMonthStr}-${dayNum.toString().padStart(2, '0')}`;
                        const isSelected = selectedCalendarDay === dayStr;
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dayStr;

                        const dayTxs = calendarMonthTxs.filter(t => {
                          if (!t.date) return false;
                          try {
                            return format(new Date(t.date), 'yyyy-MM-dd') === dayStr;
                          } catch {
                            return false;
                          }
                        });

                        const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                        const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                        const dayNet = dayIncome - dayExpense;
                        const hasTxs = dayTxs.length > 0;

                        const isUnderBudget = dailyBudget > 0 && dayExpense > 0 && dayExpense <= dailyBudget;
                        const isOverBudget = dailyBudget > 0 && dayExpense > dailyBudget;

                        return (
                          <button
                            key={`day-${dayNum}`}
                            onClick={() => setSelectedCalendarDay(dayStr)}
                            className={cn(
                              "aspect-square p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer",
                              isSelected 
                                ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20" 
                                : isToday
                                  ? "border-orange-400 bg-orange-500/5 dark:bg-orange-500/10 ring-1 ring-orange-500/30"
                                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-xs"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={cn(
                                "text-xs font-extrabold flex items-center justify-center w-5 h-5 rounded-full",
                                isToday 
                                  ? "bg-orange-500 text-white" 
                                  : isSelected 
                                    ? "bg-emerald-500 text-white" 
                                    : "text-zinc-700 dark:text-zinc-300"
                              )}>
                                {dayNum}
                              </span>
                              
                              {hasTxs && (
                                <div className="flex gap-0.5">
                                  {dayIncome > 0 && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="มีรายรับ"></span>}
                                  {dayExpense > 0 && (
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isOverBudget ? "bg-red-500" : isUnderBudget ? "bg-green-500" : "bg-zinc-400"
                                    )} title={isOverBudget ? "เกินงบ" : isUnderBudget ? "อยู่ในงบ" : "มีรายจ่าย"}></span>
                                  )}
                                </div>
                              )}
                            </div>

                            {hasTxs ? (
                              <div className="text-[9px] font-bold mt-1 overflow-hidden text-ellipsis whitespace-nowrap w-full">
                                {dayNet > 0 ? (
                                  <span className="text-green-600 dark:text-green-400 font-mono">+{dayNet.toLocaleString()}</span>
                                ) : dayNet < 0 ? (
                                  <span className="text-red-500 font-mono">-{Math.abs(dayNet).toLocaleString()}</span>
                                ) : (
                                  <span className="text-zinc-400 font-mono">฿0</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[8px] text-zinc-300 dark:text-zinc-700 font-medium">ไม่มีรายการ</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Details Side Panel */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                    {selectedCalendarDay ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                              รายการวันที่ {selectedCalendarDay.split('-')[2]} {getThaiMonthName(selectedCalendarDay.split('-')[1])} {parseInt(selectedCalendarDay.split('-')[0]) + 543}
                            </h4>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">สรุปด่วนและประวัติรายการของวันนี้</p>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentView('add');
                            }}
                            className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> บันทึกใหม่
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">รายรับ</span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 font-mono">฿{selectedDayIncome.toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">รายจ่าย</span>
                            <span className="text-xs font-bold text-red-500 font-mono">฿{selectedDayExpense.toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">ยอดดุล</span>
                            <span className={cn(
                              "text-xs font-bold font-mono",
                              selectedDaySavings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                            )}>
                              ฿{selectedDaySavings.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Expense limit warning */}
                        {dailyBudget > 0 && selectedDayExpense > 0 && (
                          <div className={cn(
                            "px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2 font-medium",
                            selectedDayExpense <= dailyBudget 
                              ? "bg-green-500/5 border-green-500/10 text-green-600 dark:text-green-400" 
                              : "bg-red-500/5 border-red-500/10 text-red-500"
                          )}>
                            {selectedDayExpense <= dailyBudget ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                <span>อยู่ในงบรายวัน (฿{selectedDayExpense.toLocaleString()} / ฿{dailyBudget.toLocaleString()})</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span>เกินงบรายวันสะสมที่ตั้งไว้ {dailyBudget.toLocaleString()} บาท</span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {selectedDayTxs.length > 0 ? (
                            selectedDayTxs.map((tx) => (
                              <div 
                                key={tx.id} 
                                onClick={() => setSelectedTxForView(tx)}
                                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/40 p-3 rounded-xl flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {(() => {
                                    const visuals = getCategoryVisuals(tx.category, tx.type);
                                    const VisualIcon = visuals.icon;
                                    return (
                                      <div className="relative shrink-0">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                                          visuals.bgClass
                                        )}>
                                          <VisualIcon className="w-4 h-4" />
                                        </div>
                                        <span className={cn(
                                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white dark:border-zinc-950 flex items-center justify-center text-[6px] font-bold text-white shadow-xs",
                                          tx.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                                        )}>
                                          {tx.type === 'income' ? '+' : '-'}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate leading-tight">{tx.category}</span>
                                    {tx.note && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate block mt-0.5">{tx.note}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 font-mono">
                                  <span className={cn(
                                    "text-xs font-bold",
                                    tx.type === 'income' ? "text-green-600 dark:text-green-400" : "text-zinc-800 dark:text-zinc-200"
                                  )}>
                                    {tx.type === 'income' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                                  </span>
                                  <Sparkles className="w-3 h-3 text-transparent group-hover:text-purple-400 transition-colors shrink-0" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                              <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                              <span>ไม่มีรายการธุรกรรมของวันนี้</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center text-zinc-400 dark:text-zinc-500 text-xs flex flex-col items-center justify-center gap-3">
                        <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">เลือกดูรายละเอียดรายวัน</h4>
                          <p className="max-w-xs mx-auto text-zinc-400 leading-relaxed">คลิกเลือกวันใดก็ได้ในปฏิทินเพื่อวิเคราะห์รายรับ-รายจ่ายของวันนั้นๆ อย่างรวดเร็ว</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Daily Budget Toast Notification */}
      {isOverBudget && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold whitespace-nowrap">ใช้จ่ายเกินงบรายวัน!</span>
            <span className="text-sm opacity-90 whitespace-nowrap">
              (฿{todayExpenses.toLocaleString()} / ฿{dailyBudget.toLocaleString()})
            </span>
          </div>
        </div>
      )}

      {/* Transaction Details & AI Analysis Modal */}
      {selectedTxForView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <button 
              onClick={() => setSelectedTxForView(null)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              {(() => {
                const visuals = getCategoryVisuals(selectedTxForView.category, selectedTxForView.type);
                const VisualIcon = visuals.icon;
                return (
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                      visuals.bgClass
                    )}>
                      <VisualIcon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-extrabold text-white shadow-xs",
                      selectedTxForView.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                    )}>
                      {selectedTxForView.type === 'income' ? '+' : '-'}
                    </span>
                  </div>
                );
              })()}
              <div>
                <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                  {selectedTxForView.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                </span>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{selectedTxForView.category}</h4>
              </div>
            </div>

            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-5 mb-5">
              <p className={cn(
                "text-3xl font-black mb-4",
                selectedTxForView.type === 'income' ? "text-blue-500" : "text-orange-500"
              )}>
                {selectedTxForView.type === 'income' ? '+ ' : '- '}
                ฿{selectedTxForView.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <div>
                  <span className="block text-xs text-zinc-400 mb-0.5">วันที่และเวลา</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedTxForView.date ? format(new Date(selectedTxForView.date), 'dd MMM yyyy, HH:mm') : '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-400 mb-0.5">บันทึกช่วยจำ</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 italic break-words">
                    {selectedTxForView.note || 'ไม่มีบันทึกช่วยจำ'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Insight Section */}
            <div className="bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-5">
              <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Gemini AI สรุปและวิเคราะห์รายการ
              </h5>

              {isAnalyzingTx ? (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Gemini กำลังประมวลผลและเขียนคำแนะนำการเงินให้คุณ...</p>
                </div>
              ) : txAnalysisError ? (
                <div className="py-2 text-center">
                  <p className="text-xs text-red-500 mb-2">{txAnalysisError}</p>
                  <button 
                    onClick={() => handleViewTransaction(selectedTxForView)}
                    className="text-xs font-bold text-orange-500 hover:underline"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              ) : txAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">ภาพรวมธุรกรรม</span>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                      {txAnalysis.summary}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-orange-100/40 dark:border-orange-900/10">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">คำแนะนำสร้างสรรค์</span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-orange-100/20 dark:border-orange-900/10">
                      {txAnalysis.tip}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center">
                  <button 
                    onClick={() => handleViewTransaction(selectedTxForView)}
                    className="text-xs font-bold text-orange-500 hover:underline"
                  >
                    วิเคราะห์ข้อมูลด้วย AI ตอนนี้
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setSelectedTxForView(null)}
                className="w-full bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

