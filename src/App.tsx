import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  MessageSquare, 
  User, 
  CreditCard, 
  Megaphone, 
  Key, 
  HelpCircle,
  Send,
  History,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Copy,
  Share2,
  X,
  Settings,
  Bell,
  Search,
  PieChart,
  Moon,
  Sun,
  TrendingUp,
  Plus,
  Filter,
  Inbox,
  Truck,
  Receipt,
  GraduationCap,
  Briefcase,
  Wrench,
  Plane,
  AlertTriangle,
  Share,
  Ghost,
  Scan,
  Wand2,
  RefreshCw,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { classificationService, MessageType, ClassificationResult } from './services/classificationService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageRecord {
  id: string;
  sender: string;
  text: string;
  result: ClassificationResult;
  timestamp: number;
  isOutgoing?: boolean;
}

interface Conversation {
  id: string;
  contactName: string;
  phoneNumber: string;
  lastMessage: MessageRecord;
  messages: MessageRecord[];
  unreadCount: number;
}

const CONTACTS_MOCK: Record<string, string> = {
  "+91 98765 43210": "John Doe",
  "HDFC BANK": "HDFC Bank Alerts",
  "Amazon": "Amazon Shipping",
  "Jio": "Jio Support",
  "College Admin": "Prof. Sharma",
  "HR Team": "TechCorp HR",
  "Airtel": "Airtel Alerts",
  "Instagram": "Instagram",
  "Mom": "Mom ❤️",
  "Zomato": "Zomato",
  "WinBig": "Unknown (Spam)",
};

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [input, setInput] = useState('');
  const [senderInput, setSenderInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MessageRecord | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | MessageType>('ALL');
  const [showSimulate, setShowSimulate] = useState(false);
  const [showManualDetect, setShowManualDetect] = useState(false);
  const [manualResult, setManualResult] = useState<ClassificationResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [newArrival, setNewArrival] = useState<MessageRecord | null>(null);

  const mockMessages = [
    { sender: "+91 98765 43210", text: "Your OTP for login is 4589. Do not share it with anyone." },
    { sender: "HDFC BANK", text: "Rs.500 debited from your account XX1234. Available balance is Rs.12,450." },
    { sender: "Amazon", text: "Your order for 'Wireless Headphones' will arrive today by 8 PM." },
    { sender: "Jio", text: "Your mobile recharge of Rs.299 is successful. Validity: 28 days." },
    { sender: "College Admin", text: "Class starts at 9 AM tomorrow in Room 302. Attendance is mandatory." },
    { sender: "HR Team", text: "You are shortlisted for the interview on Monday. Please confirm your availability." },
    { sender: "Airtel", text: "Flood alert in your area. Please stay safe and follow local guidelines." },
    { sender: "Instagram", text: "You received a new friend request from @johndoe." },
    { sender: "Mom", text: "Hi, where are you? Call me when you see this." },
    { sender: "Zomato", text: "50% discount on your next order! Use code HUNGRY50." },
    { sender: "WinBig", text: "Congratulations! You won a lottery of $1,000,000. Click here to claim: bit.ly/spam" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    const saved = localStorage.getItem('msg_conversations_v2');
    if (saved) {
      try {
        setConversations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('msg_conversations_v2', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        handleClassify(randomMsg.text, randomMsg.sender).then(record => {
          if (record) {
            setNewArrival(record);
            setTimeout(() => setNewArrival(null), 5000);
          }
        });
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const handleClassify = async (textToUse?: string, senderToUse?: string, isOutgoing = false) => {
    const finalInput = textToUse || input;
    const finalSender = senderToUse || senderInput || "Unknown Sender";
    
    if (!finalInput.trim() || loading) return;

    setLoading(true);
    try {
      const result = await classificationService.classifyMessage(finalInput);
      
      const newRecord: MessageRecord = {
        id: crypto.randomUUID(),
        sender: finalSender,
        text: finalInput,
        result,
        timestamp: Date.now(),
        isOutgoing
      };
      
      setConversations(prev => {
        const existingIdx = prev.findIndex(c => c.phoneNumber === finalSender || c.contactName === finalSender);
        let updated = [...prev];
        if (existingIdx > -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMessage: newRecord,
            messages: [newRecord, ...updated[existingIdx].messages],
            unreadCount: isOutgoing ? 0 : updated[existingIdx].unreadCount + 1
          };
          const [item] = updated.splice(existingIdx, 1);
          updated = [item, ...updated];
        } else {
          const newConv: Conversation = {
            id: crypto.randomUUID(),
            contactName: CONTACTS_MOCK[finalSender] || finalSender,
            phoneNumber: finalSender,
            lastMessage: newRecord,
            messages: [newRecord],
            unreadCount: isOutgoing ? 0 : 1
          };
          updated = [newConv, ...updated];
        }
        return updated;
      });

      if (!textToUse) {
        setInput('');
        setSenderInput('');
        setShowSimulate(false);
      }
      return newRecord;
    } catch (error) {
      console.error("Classification failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualDetect = async () => {
    if (!manualInput.trim() || loading) return;
    setLoading(true);
    try {
      const result = await classificationService.classifyMessage(manualInput);
      setManualResult(result);
    } catch (error) {
      console.error("Manual detection failed", error);
    } finally {
      setLoading(false);
    }
  };

  const reClassify = async (record: MessageRecord) => {
    setLoading(true);
    try {
      const result = await classificationService.classifyMessage(record.text);
      const updated = { ...record, result };
      setConversations(prev => prev.map(c => ({
        ...c,
        messages: c.messages.map(m => m.id === record.id ? updated : m),
        lastMessage: c.lastMessage.id === record.id ? updated : c.lastMessage
      })));
      setSelectedRecord(updated);
    } catch (error) {
      console.error("Re-classification failed", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const clearHistory = () => {
    if (confirm('Clear all messages?')) {
      setConversations([]);
    }
  };

  const getIcon = (type: MessageType, size = 20) => {
    switch (type) {
      case MessageType.SPAM: return <ShieldAlert size={size} className="text-red-500" />;
      case MessageType.PERSONAL: return <User size={size} className="text-blue-500" />;
      case MessageType.BANK_TRANSACTION: return <CreditCard size={size} className="text-emerald-500" />;
      case MessageType.PROMOTION: return <Megaphone size={size} className="text-orange-500" />;
      case MessageType.OTP: return <Key size={size} className="text-purple-500" />;
      case MessageType.DELIVERY: return <Truck size={size} className="text-amber-600" />;
      case MessageType.RECHARGE_BILL: return <Receipt size={size} className="text-cyan-500" />;
      case MessageType.COLLEGE_SCHOOL: return <GraduationCap size={size} className="text-indigo-500" />;
      case MessageType.JOB: return <Briefcase size={size} className="text-slate-600" />;
      case MessageType.SERVICE: return <Wrench size={size} className="text-zinc-500" />;
      case MessageType.TRAVEL: return <Plane size={size} className="text-sky-500" />;
      case MessageType.EMERGENCY: return <AlertTriangle size={size} className="text-rose-600" />;
      case MessageType.SOCIAL_MEDIA: return <Share size={size} className="text-pink-500" />;
      default: return <Ghost size={size} className="text-zinc-400" />;
    }
  };

  const getColorClass = (type: MessageType) => {
    switch (type) {
      case MessageType.SPAM: return "bg-red-50 text-red-700 border-red-100";
      case MessageType.PERSONAL: return "bg-blue-50 text-blue-700 border-blue-100";
      case MessageType.BANK_TRANSACTION: return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case MessageType.PROMOTION: return "bg-orange-50 text-orange-700 border-orange-100";
      case MessageType.OTP: return "bg-purple-50 text-purple-700 border-purple-100";
      case MessageType.DELIVERY: return "bg-amber-50 text-amber-700 border-amber-100";
      case MessageType.RECHARGE_BILL: return "bg-cyan-50 text-cyan-700 border-cyan-100";
      case MessageType.COLLEGE_SCHOOL: return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case MessageType.JOB: return "bg-slate-50 text-slate-700 border-slate-100";
      case MessageType.SERVICE: return "bg-zinc-50 text-zinc-700 border-zinc-100";
      case MessageType.TRAVEL: return "bg-sky-50 text-sky-700 border-sky-100";
      case MessageType.EMERGENCY: return "bg-rose-50 text-rose-700 border-rose-100";
      case MessageType.SOCIAL_MEDIA: return "bg-pink-50 text-pink-700 border-pink-100";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-100";
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'ALL' || conv.lastMessage.result.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: conversations.reduce((acc, c) => acc + c.messages.length, 0),
    spam: conversations.filter(c => c.lastMessage.result.type === MessageType.SPAM).length,
    personal: conversations.filter(c => c.lastMessage.result.type === MessageType.PERSONAL).length,
    bank: conversations.filter(c => c.lastMessage.result.type === MessageType.BANK_TRANSACTION).length,
    otp: conversations.filter(c => c.lastMessage.result.type === MessageType.OTP).length,
  };

  const priorityCategories = [
    { type: MessageType.OTP, label: 'OTP', icon: <Key size={16} /> },
    { type: MessageType.BANK_TRANSACTION, label: 'Bank', icon: <CreditCard size={16} /> },
    { type: MessageType.EMERGENCY, label: 'Emergency', icon: <AlertTriangle size={16} /> },
    { type: MessageType.SPAM, label: 'Spam', icon: <ShieldAlert size={16} /> },
    { type: MessageType.PERSONAL, label: 'Personal', icon: <User size={16} /> },
    { type: MessageType.DELIVERY, label: 'Delivery', icon: <Truck size={16} /> },
    { type: MessageType.RECHARGE_BILL, label: 'Bills', icon: <Receipt size={16} /> },
    { type: MessageType.COLLEGE_SCHOOL, label: 'College', icon: <GraduationCap size={16} /> },
    { type: MessageType.JOB, label: 'Job', icon: <Briefcase size={16} /> },
    { type: MessageType.SERVICE, label: 'Service', icon: <Wrench size={16} /> },
    { type: MessageType.TRAVEL, label: 'Travel', icon: <Plane size={16} /> },
    { type: MessageType.SOCIAL_MEDIA, label: 'Social', icon: <Share size={16} /> },
  ];

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-white/10">
            <Inbox className="text-zinc-900 w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-white text-3xl font-bold tracking-tighter">Android Messages AI</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Smart SMS Engine</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen py-0 sm:py-8 font-sans transition-colors duration-500",
      isDarkMode ? "bg-zinc-950 selection:bg-white selection:text-zinc-900" : "bg-zinc-100 selection:bg-zinc-900 selection:text-white"
    )}>
      <div className={cn(
        "mobile-container h-[100vh] sm:h-[844px] sm:rounded-[3rem] border-zinc-200 transition-colors duration-500 overflow-hidden flex flex-col relative",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* Status Bar Simulation */}
        <div className="px-8 pt-4 pb-2 flex justify-between items-center text-[11px] font-bold text-zinc-400">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-2.5 border border-zinc-300 rounded-[2px] relative">
              <div className="absolute inset-[1px] bg-zinc-400 rounded-[1px] w-2/3" />
            </div>
            <div className="w-3 h-3 bg-zinc-400 rounded-full" />
          </div>
        </div>

        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedConversation ? (
              <button 
                onClick={() => setSelectedConversation(null)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isDarkMode ? "text-white hover:bg-zinc-800" : "text-zinc-900 hover:bg-zinc-100"
                )}
              >
                <ArrowLeft size={24} />
              </button>
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                isDarkMode ? "bg-white shadow-white/5" : "bg-zinc-900 shadow-zinc-900/20"
              )}>
                <Inbox className={isDarkMode ? "text-zinc-900 w-5 h-5" : "text-white w-5 h-5"} />
              </div>
            )}
            <h1 className={cn("font-bold text-xl tracking-tight transition-colors truncate max-w-[180px]", isDarkMode ? "text-white" : "text-zinc-900")}>
              {selectedConversation ? selectedConversation.contactName : "Messages"}
            </h1>
          </div>
          <div className="flex gap-2">
            {selectedConversation ? (
              <>
                <button className={cn("p-2 rounded-xl", isDarkMode ? "text-zinc-400" : "text-zinc-500")}><Phone size={20} /></button>
                <button className={cn("p-2 rounded-xl", isDarkMode ? "text-zinc-400" : "text-zinc-500")}><Video size={20} /></button>
                <button className={cn("p-2 rounded-xl", isDarkMode ? "text-zinc-400" : "text-zinc-500")}><MoreVertical size={20} /></button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={cn(
                    "p-2.5 rounded-xl shadow-sm border transition-all flex items-center gap-2",
                    isLive 
                      ? "bg-emerald-500 border-emerald-400 text-white" 
                      : (isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-100 text-zinc-400")
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", isLive ? "bg-white animate-pulse" : "bg-zinc-400")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isLive ? "Live" : "Idle"}</span>
                </button>
                <button 
                  onClick={() => setShowManualDetect(true)}
                  className={cn(
                    "p-2.5 rounded-xl shadow-sm border transition-all",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white" : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-900"
                  )}
                >
                  <Scan size={18} />
                </button>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={cn(
                    "p-2.5 rounded-xl shadow-sm border transition-all",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white" : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-900"
                  )}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Search & Tabs (Inbox Only) */}
        {!selectedConversation && (
          <div className="px-6 space-y-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className={cn(
                  "w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold transition-all outline-none border-2",
                  isDarkMode 
                    ? "bg-zinc-800 border-zinc-700 text-white focus:border-white" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-900"
                )}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setActiveTab('ALL')}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                  activeTab === 'ALL' 
                    ? (isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white")
                    : (isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
                )}
              >
                All
              </button>
              {priorityCategories.map(cat => (
                <button
                  key={cat.type}
                  onClick={() => setActiveTab(cat.type)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2",
                    activeTab === cat.type 
                      ? (isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white")
                      : (isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
                  )}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 scrollbar-hide">
          {selectedConversation ? (
            /* Chat View */
            <div className="flex flex-col-reverse h-full space-y-4 space-y-reverse py-4">
              {selectedConversation.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedRecord(msg)}
                  className={cn(
                    "max-w-[85%] p-4 rounded-3xl text-sm font-medium relative cursor-pointer",
                    msg.isOutgoing 
                      ? "self-end bg-emerald-500 text-white rounded-tr-none" 
                      : (isDarkMode ? "bg-zinc-800 text-white rounded-tl-none" : "bg-zinc-100 text-zinc-900 rounded-tl-none")
                  )}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className={cn(
                    "mt-2 text-[9px] font-bold opacity-60 flex items-center justify-between gap-4",
                    msg.isOutgoing ? "text-white" : (isDarkMode ? "text-zinc-400" : "text-zinc-500")
                  )}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!msg.isOutgoing && (
                      <span className="px-1.5 py-0.5 rounded-full bg-black/10 uppercase tracking-widest">
                        {msg.result.type}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Inbox View */
            <>
              {/* Priority Sections */}
              {activeTab === 'ALL' && conversations.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <h2 className={cn("text-xs font-black uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>Priority</h2>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                    {[MessageType.OTP, MessageType.EMERGENCY, MessageType.BANK_TRANSACTION, MessageType.DELIVERY].map(type => {
                      const latestConv = conversations.find(c => c.lastMessage.result.type === type);
                      if (!latestConv) return null;
                      
                      return (
                        <motion.div
                          key={type}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedConversation(latestConv)}
                          className={cn(
                            "min-w-[240px] p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
                            isDarkMode ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-100"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center",
                              getColorClass(type)
                            )}>
                              {getIcon(type, 20)}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              {new Date(latestConv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className={cn("text-xs font-black truncate", isDarkMode ? "text-white" : "text-zinc-900")}>{latestConv.contactName}</p>
                            <p className={cn("text-[11px] font-medium line-clamp-2 leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                              {latestConv.lastMessage.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Conversations List */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isDarkMode ? "bg-white" : "bg-zinc-900")} />
                    <h2 className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-white" : "text-zinc-900")}>
                      Conversations
                    </h2>
                  </div>
                  {conversations.length > 0 && (
                    <button onClick={clearHistory} className="text-[10px] font-bold text-zinc-400 uppercase">Clear All</button>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredConversations.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", isDarkMode ? "bg-zinc-800" : "bg-zinc-100")}>
                        <MessageSquare size={32} className="text-zinc-400" />
                      </div>
                      <p className="text-zinc-400 text-sm font-bold">No messages yet</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <motion.div
                        key={conv.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                        }}
                        className={cn(
                          "p-5 rounded-3xl flex items-start gap-4 group cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all border relative overflow-hidden",
                          isDarkMode ? "bg-zinc-800 border-zinc-700 hover:border-zinc-600" : "bg-white border-zinc-100 hover:border-zinc-200"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm text-lg font-black",
                          isDarkMode ? "bg-zinc-700 text-white" : "bg-zinc-100 text-zinc-900"
                        )}>
                          {conv.contactName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn("font-black text-sm truncate", isDarkMode ? "text-white" : "text-zinc-900")}>
                              {conv.contactName}
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={cn("text-xs line-clamp-1 font-medium leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                            {conv.lastMessage.text}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                            {conv.unreadCount}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Reply Input (Chat View Only) */}
        {selectedConversation && (
          <div className={cn(
            "px-6 py-4 border-t flex items-center gap-3 absolute bottom-0 left-0 right-0 z-50",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Text message"
              className={cn(
                "flex-1 px-5 py-3 rounded-2xl text-sm font-bold outline-none border-2 transition-all",
                isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-white" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-900"
              )}
              onKeyPress={(e) => e.key === 'Enter' && handleClassify(input, selectedConversation.phoneNumber, true)}
            />
            <button 
              onClick={() => handleClassify(input, selectedConversation.phoneNumber, true)}
              disabled={!input.trim() || loading}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        )}

        {/* Floating Action Button (Inbox Only) */}
        {!selectedConversation && (
          <div className="absolute bottom-8 right-6 z-50">
            <button 
              onClick={() => setShowSimulate(true)}
              className={cn(
                "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90",
                isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
              )}
            >
              <Plus size={24} />
            </button>
          </div>
        )}

        {/* Simulate SMS Modal */}
        <AnimatePresence>
          {showSimulate && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSimulate(false)}
                className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={cn(
                  "w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl space-y-6",
                  isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white"
                )}
              >
                <div className="space-y-2">
                  <h2 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>New Message</h2>
                  <p className="text-xs text-zinc-400 font-medium">Send or simulate an SMS</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">To</label>
                    <input 
                      type="text"
                      value={senderInput}
                      onChange={(e) => setSenderInput(e.target.value)}
                      placeholder="Name or Number"
                      className={cn(
                        "w-full px-5 py-3.5 rounded-2xl text-sm font-bold outline-none border-2 transition-all",
                        isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-white" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-900"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Message</label>
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type message..."
                      className={cn(
                        "w-full px-5 py-3.5 rounded-2xl text-sm font-bold outline-none border-2 transition-all h-32 resize-none",
                        isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-white" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-900"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSimulate(false)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-xs transition-all",
                      isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleClassify()}
                    disabled={!input.trim() || loading}
                    className={cn(
                      "flex-[2] py-4 rounded-2xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2",
                      isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
                    )}
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Send SMS</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Manual Detect Modal */}
        <AnimatePresence>
          {showManualDetect && (
            <div className="absolute inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowManualDetect(false);
                  setManualResult(null);
                  setManualInput('');
                }}
                className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={cn(
                  "w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl space-y-6",
                  isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white"
                )}
              >
                <div className="space-y-2">
                  <h2 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>Manual Detection</h2>
                  <p className="text-xs text-zinc-400 font-medium">Analyze any text without adding to inbox</p>
                </div>

                <div className="space-y-4">
                  <textarea 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Paste message text here..."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none border-2 transition-all h-32 resize-none",
                      isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-white" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-900"
                    )}
                  />
                  
                  {manualResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl border-2 space-y-3",
                        getColorClass(manualResult.type)
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getIcon(manualResult.type, 20)}
                        <span className="font-black text-xs uppercase tracking-widest">{manualResult.type}</span>
                      </div>
                      <p className="text-[11px] font-bold leading-relaxed opacity-80">{manualResult.reason}</p>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowManualDetect(false);
                      setManualResult(null);
                      setManualInput('');
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-xs transition-all",
                      isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                    )}
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleManualDetect}
                    disabled={!manualInput.trim() || loading}
                    className={cn(
                      "flex-[2] py-4 rounded-2xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2",
                      isDarkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
                    )}
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Wand2 size={16} /> Analyze</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedRecord && (
            <div className="absolute inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRecord(null)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                  "w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 relative shadow-2xl space-y-8",
                  isDarkMode ? "bg-zinc-900" : "bg-white"
                )}
              >
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className={cn(
                    "absolute top-6 right-8 p-2 rounded-full transition-colors",
                    isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                  )}
                >
                  <X size={20} />
                </button>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg",
                      getColorClass(selectedRecord.result.type)
                    )}>
                      {getIcon(selectedRecord.result.type, 32)}
                    </div>
                    <div>
                      <h2 className={cn("text-2xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>{selectedRecord.result.type}</h2>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {new Date(selectedRecord.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={cn(
                      "p-6 rounded-3xl border",
                      isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sender: {selectedRecord.sender}</span>
                      </div>
                      <p className={cn("text-sm font-medium leading-relaxed italic", isDarkMode ? "text-zinc-200" : "text-zinc-900")}>
                        "{selectedRecord.text}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">AI Analysis</span>
                      <p className={cn("text-sm font-semibold leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
                        {selectedRecord.result.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => reClassify(selectedRecord)}
                      disabled={loading}
                      className={cn(
                        "flex-1 py-4 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                        isDarkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-900"
                      )}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Re-detect
                    </button>
                    <button 
                      onClick={() => copyToClipboard(selectedRecord.text)}
                      className={cn(
                        "flex-1 py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all",
                        isDarkMode ? "bg-white text-zinc-900 shadow-white/5" : "bg-zinc-900 text-white shadow-zinc-900/20"
                      )}
                    >
                      Copy Message
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Message Toast */}
        <AnimatePresence>
          {newArrival && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              onClick={() => {
                const conv = conversations.find(c => c.phoneNumber === newArrival.sender || c.contactName === newArrival.sender);
                if (conv) setSelectedConversation(conv);
                setNewArrival(null);
              }}
              className={cn(
                "absolute top-16 left-6 right-6 z-[400] p-4 rounded-3xl shadow-2xl border-2 flex items-center gap-4 cursor-pointer",
                isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                getColorClass(newArrival.result.type)
              )}>
                {getIcon(newArrival.result.type, 20)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>New Message</p>
                <p className={cn("text-xs font-black truncate", isDarkMode ? "text-white" : "text-zinc-900")}>{CONTACTS_MOCK[newArrival.sender] || newArrival.sender}</p>
                <p className={cn("text-[11px] font-medium truncate", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>{newArrival.text}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Bell size={14} className="text-emerald-500 animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Home Indicator Simulation */}
        <div className={cn(
          "absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 rounded-full opacity-50",
          isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
        )} />
      </div>
    </div>
  );
}
