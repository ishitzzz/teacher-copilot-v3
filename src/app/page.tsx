"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Users, ChevronDown, Send, UserCircle, Mic, BookOpen, Glasses, Image as ImageIcon, MonitorPlay, Plus, LayoutDashboard, FileText, Settings, Rocket, FileCode2, Clock, Calendar, FileCheck, ExternalLink, Sparkles, MessageSquare, Volume2 } from "lucide-react";
import { TEACHERS, TeacherProfile } from "./data";
import { DashboardView } from "../components/DashboardView";

// --- AGENT INTENT DETECTION ---
const AGENT_KEYWORDS = [
  "schedule", "timetable", "calendar", "plan my week", "plan my day",
  "create assignment", "make assignment", "homework", "worksheet",
  "create test", "make test", "exam", "quiz", "question paper",
  "lecture plan", "lesson plan", "create a plan",
  "check schedule", "my events", "upcoming classes",
  "daily schedule", "weekly schedule", "schedule class", "schedule a class",
  // Hindi/Hinglish
  "schedule banao", "test banao", "assignment banao", "plan banao",
];

function isAgentIntent(msg: string): boolean {
  const lower = msg.toLowerCase();
  return AGENT_KEYWORDS.some(kw => lower.includes(kw));
}

function getTeacherKey(teacher: TeacherProfile): string {
  return Object.keys(TEACHERS).find(k => TEACHERS[k].id === teacher.id) || "Sunita";
}
import { generateSpeech } from "../lib/tts";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// --- 1. TYPES & INTERFACES ---
interface SpeechRecognitionResult { 0: { transcript: string }; isFinal: boolean; }
interface SpeechRecognitionEvent { results: { [index: number]: SpeechRecognitionResult; length: number; }; }
interface SpeechRecognitionErrorEvent { error: string; }
interface SpeechRecognitionInstance {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: () => void; onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void; stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface LessonGroup { name: string; task: string; students: string; }
interface LessonPlan {
  title: string; subtitle: string; strategy: string; hook: string;
  groups: LessonGroup[]; script: string; visual_type: "simulation" | "image";
  visual_prompt: string; visual_url?: string; isVR?: boolean;
}
interface ChatMessage { role: "user" | "ai"; text: string; docUrl?: string; actionPerformed?: string; }

const CLASSES = ["Class 6A", "Class 6B", "Class 7A", "Class 7B"];
const SUBJECTS = ["Math", "Physics", "Biology"];

// --- 2. AGENTIC TRANSPARENCY PHRASES ---
const getLoadingPhrases = (teacherName: string) => [
  "Searching local curriculum context...",
  `Consulting ${teacherName}'s classroom persona...`,
  "Drafting conceptual hooks & analogies...",
  "Structuring spatial abstractions...",
  "Finalizing visual simulation prompt..."
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 6A");
  const [selectedSubject, setSelectedSubject] = useState("Math");

  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(TEACHERS["Sunita"]);
  const [showTeacherMenu, setShowTeacherMenu] = useState(false);
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);

  const [result, setResult] = useState<LessonPlan | null>(null);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  const [showVR, setShowVR] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const chatLayoutRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [activeSidebarView, setActiveSidebarView] = useState<"chat" | "dashboard">("chat");

  // Auto-scroll chat — scroll only the chat container, NOT the body
  useEffect(() => {
    if (messages.length > 0 && chatLayoutRef.current) {
      chatLayoutRef.current.scrollTo({
        top: chatLayoutRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, chatLoading]);

  // Agentic Transparency Pulse Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingPlan) {
      setPulseIndex(0);
      interval = setInterval(() => {
        setPulseIndex(i => (i + 1) % 5);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loadingPlan]);

  // --- GSAP FLUID ANIMATIONS ---
  useGSAP(() => {
    const isSearching = loadingPlan || result;

    if (isSearching) {
      // Background Image fades out entirely, revealing solid bg
      gsap.to(".home-bg", { opacity: 0, duration: 1.2, ease: "power2.inOut" });
      gsap.to(containerRef.current, { backgroundColor: "#fcfcfc", duration: 1.2 });

      // Hide standard top-header
      gsap.to(".top-header", { y: -50, opacity: 0, duration: 0.5, ease: "power2.in" });

      // Search Box collapses and hides
      gsap.to(".home-hero-text", { y: -40, opacity: 0, duration: 0.4, stagger: 0.1, ease: "power2.in" });
      gsap.to(".home-search-panel", { y: "40vh", scale: 0.9, opacity: 0, duration: 0.6, ease: "power3.in" });

      // Slide In Sidebar
      gsap.fromTo(".sidebar-nav",
        { x: -300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" }
      );

      // Main Content slides into place
      gsap.fromTo(".chat-layout",
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.6, ease: "power3.out" }
      );

      // Floating chat input pops up
      gsap.fromTo(".floating-chat-input",
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.8, ease: "back.out(1.2)" }
      );

    } else {
      // Revert Back to Home View
      gsap.to(".home-bg", { opacity: 1, duration: 0.8, ease: "power2.inOut" });
      gsap.to(containerRef.current, { backgroundColor: "#fff", duration: 0.8 });

      gsap.to(".top-header", { y: 0, opacity: 1, duration: 0.5, delay: 0.3, ease: "power2.out" });
      gsap.to(".sidebar-nav", { x: -300, opacity: 0, duration: 0.4, ease: "power3.in" });
      gsap.to(".chat-layout", { opacity: 0, duration: 0.3 });
      gsap.to(".floating-chat-input", { y: 100, opacity: 0, duration: 0.3 });

      gsap.to(".home-hero-text", { y: 0, opacity: 1, duration: 0.5, delay: 0.2, stagger: 0.1, ease: "power2.out" });
      gsap.to(".home-search-panel", { y: 0, scale: 1, opacity: 1, duration: 0.6, delay: 0.3, ease: "back.out(1.2)" });
    }
  }, { dependencies: [loadingPlan, result], scope: containerRef });

  // --- API HANDLERS ---
  const handleSearch = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || query;
    if (!finalQuery) return;
    setLoadingPlan(true); setResult(null); setSimulationCode(null); setMessages([]); setShowVR(false);

    try {
      // If the homepage query is an agentic request, route through agent API
      if (isAgentIntent(finalQuery)) {
        const agentRes = await fetch("/api/agent", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: finalQuery,
            teacherKey: getTeacherKey(currentTeacher),
            className: selectedClass,
          }),
        });
        const agentData = await agentRes.json();

        // Create a minimal result to trigger the chat view
        setResult({
          title: `🤖 Agent Task`, subtitle: finalQuery,
          strategy: "", hook: "", groups: [], script: "",
          visual_type: "image", visual_prompt: "",
          visual_url: "", isVR: false,
        });
        setLoadingPlan(false);
        setMessages([{
          role: "ai",
          text: agentData.reply || agentData.error || "Task completed.",
          docUrl: agentData.docUrl,
          actionPerformed: agentData.actionPerformed,
        }]);
        return;
      }

      // Normal lesson plan flow
      const planRes = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "plan", query: finalQuery, className: selectedClass, subject: selectedSubject, teacherId: currentTeacher.id }),
      });
      const planData = await planRes.json();
      if (planData.error) throw new Error(planData.error);

      setResult(planData);
      setLoadingPlan(false);

      if (!planData.isVR && planData.visual_type === "simulation") {
        const simRes = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "simulation", simulation_prompt: planData.visual_prompt }),
        });
        const simData = await simRes.json();
        setSimulationCode(simData.code);
      }
    } catch (error) {
      console.error(error); alert("Something went wrong. Please try again.");
      setLoadingPlan(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !result) return;
    const userMsg = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      // Route through AGENT API if intent matches
      if (isAgentIntent(userMsg)) {
        const response = await fetch("/api/agent", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: userMsg,
            teacherKey: getTeacherKey(currentTeacher),
            className: selectedClass,
          }),
        });
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: "ai",
          text: data.reply || data.error || "Something went wrong.",
          docUrl: data.docUrl,
          actionPerformed: data.actionPerformed,
        }]);
      } else {
        // Normal follow-up chat
        const response = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "chat", currentPlan: result, userQuestion: userMsg,
            teacherId: currentTeacher.id, className: selectedClass,
          }),
        });
        const data = await response.json();
        setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Connection error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice not supported in this browser.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; recognition.continuous = false; recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => setQuery(event.results[event.results.length - 1][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- RESET TO HOME ---
  const resetToHome = () => {
    setResult(null); setLoadingPlan(false); setQuery(""); setSimulationCode(null); setMessages([]);
  };

  const styles = {
    container: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, display: "flex", fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif', overflow: "hidden", background: "#fff" },
    dropdownMenu: { position: "absolute" as const, top: "120%", left: 0, background: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "16px", padding: "8px", minWidth: "160px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 50, display: "flex", flexDirection: "column" as const, gap: "4px" },
    sidebarItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", color: "#444", cursor: "pointer", transition: "all 0.2s" },
    card: { background: "white", padding: "32px", borderRadius: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", marginBottom: "24px" }
  };

  return (
    <main style={styles.container} ref={containerRef}>

      {/* BACKGROUND IMAGE - Hides on search */}
      <div className="home-bg" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url('/classroom-bg.png')`, backgroundSize: "cover", backgroundPosition: "center", transform: "scale(1.05)", zIndex: 0 }} />

      {/* --- HOMEPAGE HEADER --- */}
      <div className="top-header" style={{ position: "absolute", top: "32px", width: "100%", display: "flex", justifyContent: "flex-end", padding: "0 40px", zIndex: 10 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowTeacherMenu(!showTeacherMenu)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.7)", borderRadius: "30px", fontSize: "14px", fontWeight: "600", color: "#111", border: "1px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <UserCircle size={16} /> {currentTeacher.name} <ChevronDown size={14} style={{ opacity: 0.5 }} />
          </button>
          {showTeacherMenu && (
            <div style={{ ...styles.dropdownMenu, right: 0, left: "auto" }}>
              {Object.values(TEACHERS).map((t) => (
                <div key={t.id} onClick={() => { setCurrentTeacher(t); setShowTeacherMenu(false); }} style={{ padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#111" }} className="hover:bg-gray-100">{t.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- HOMEPAGE SEARCH MODE (LAYER 1) --- */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: (loadingPlan || result) ? "none" : "auto", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: "760px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 className="home-hero-text" style={{ fontSize: "84px", fontWeight: "400", textAlign: "center", letterSpacing: "-0.03em", fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif", margin: "0 0 16px 0", color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            Teach with <span style={{ fontStyle: "italic" }}>context.</span>
          </h1>
          <h2 className="home-hero-text" style={{ fontSize: "20px", fontWeight: "400", textAlign: "center", color: "rgba(255,255,255,0.95)", marginBottom: "48px", textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
            Create powerful lesson plans & simulations by chatting with AI
          </h2>

          <div className="home-search-panel" style={{ width: "100%", background: "white", borderRadius: "16px", padding: "12px", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)" }}>
            <div style={{ position: "relative" }}>
              <textarea
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={`Hi ${currentTeacher.name.split(" ")[0]}, what are we teaching today?`}
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", fontSize: "18px", outline: "none", resize: "none", height: "120px", color: "#111", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "4px 12px 4px 4px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowClassMenu(!showClassMenu)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", padding: "8px 12px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#666" }}><Users size={16} /> {selectedClass}</button>
                    {showClassMenu && <div style={{ ...styles.dropdownMenu, bottom: "100%", top: "auto", marginBottom: "8px" }}>{CLASSES.map(c => <div key={c} onClick={() => { setSelectedClass(c); setShowClassMenu(false) }} style={{ padding: "8px 12px", fontSize: "13px", cursor: "pointer", color: "#111", fontWeight: "500" }} className="hover:bg-gray-50 rounded-md">{c}</div>)}</div>}
                  </div>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowSubjectMenu(!showSubjectMenu)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", padding: "8px 12px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#666" }}><BookOpen size={16} /> {selectedSubject}</button>
                    {showSubjectMenu && <div style={{ ...styles.dropdownMenu, bottom: "100%", top: "auto", marginBottom: "8px" }}>{SUBJECTS.map(s => <div key={s} onClick={() => { setSelectedSubject(s); setShowSubjectMenu(false) }} style={{ padding: "8px 12px", fontSize: "13px", cursor: "pointer", color: "#111", fontWeight: "500" }} className="hover:bg-gray-50 rounded-md">{s}</div>)}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={toggleListening} style={{ width: "32px", height: "32px", background: isListening ? "#ef4444" : "transparent", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", color: isListening ? "white" : "#999", transition: "all 0.2s" }}><Mic size={16} /></button>
                  <button onClick={() => handleSearch()} style={{ width: "32px", height: "32px", background: "#000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", color: "white" }}><ArrowUp size={16} strokeWidth={3} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SIDEBAR NAV (Appears during Chat/Result mode) --- */}
      <div
        className="sidebar-nav"
        style={{ width: "260px", background: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", padding: "32px 24px", zIndex: 5, position: "absolute", left: 0, top: 0, bottom: 0, opacity: 0 }}
      >
        <button onClick={resetToHome} style={{ background: "#111", color: "white", border: "none", borderRadius: "10px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", marginBottom: "32px", width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <Plus size={16} /> New project
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            onClick={() => setActiveSidebarView("chat")}
            style={{ ...styles.sidebarItem, background: activeSidebarView === "chat" ? "#f8fafc" : "transparent", color: activeSidebarView === "chat" ? "#0f172a" : "#64748b", fontWeight: activeSidebarView === "chat" ? "600" : "500" }}
            className={activeSidebarView === "chat" ? "" : "hover:bg-gray-50"}
          >
            <MessageSquare size={18} /> Chat
          </div>
          <div
            onClick={() => setActiveSidebarView("dashboard")}
            style={{ ...styles.sidebarItem, background: activeSidebarView === "dashboard" ? "#0f172a" : "transparent", color: activeSidebarView === "dashboard" ? "white" : "#64748b", fontWeight: activeSidebarView === "dashboard" ? "600" : "500" }}
            className={activeSidebarView === "dashboard" ? "" : "hover:bg-gray-50"}
          >
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className="hover:bg-gray-50" style={styles.sidebarItem}><FileText size={18} /> Docs</div>
          <div className="hover:bg-gray-50" style={styles.sidebarItem}><Rocket size={18} /> Templates</div>
          <div className="hover:bg-gray-50" style={styles.sidebarItem}><Settings size={18} /> Settings</div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginLeft: "16px" }}>Recent Projects</div>
          <div className="hover:bg-gray-50" style={styles.sidebarItem}><FileCode2 size={16} color="#64748b" /> Photosynthesis</div>
          <div className="hover:bg-gray-50" style={styles.sidebarItem}><Clock size={16} color="#64748b" /> Gravity Lab Demo</div>
        </div>
      </div>

      {/* --- LAYER 2: CHAT & RESULT MODE --- */}
      <div
        ref={chatLayoutRef}
        className="chat-layout"
        style={{
          flex: 1, left: "260px", opacity: 0,
          pointerEvents: (!loadingPlan && !result) ? "none" : "auto",
          display: "flex", flexDirection: "column",
          alignItems: activeSidebarView === "dashboard" ? "stretch" : "center",
          overflowY: "auto", overscrollBehavior: "contain",
          position: "absolute", top: 0, right: 0, bottom: 0,
          background: activeSidebarView === "dashboard" ? "#06090f" : "transparent"
        }}
      >
        {activeSidebarView === "dashboard" ? (
          <DashboardView teacher={currentTeacher} />
        ) : (
          <div style={{ width: "100%", maxWidth: "800px", padding: "40px 40px 160px 40px", display: "flex", flexDirection: "column" }}>

            {/* THE THINKING PHASE: Agentic Transparency */}
            {loadingPlan && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Brain Pulse Animation Ring */}
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#3b82f6" }} />
                  <div style={{ width: "40px", height: "40px", background: "#111", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                    <Glasses color="white" size={20} />
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.h2 key={pulseIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }} style={{ fontSize: "16px", fontWeight: "500", color: "#666", letterSpacing: "-0.01em" }}>
                    {getLoadingPhrases(currentTeacher.name)[pulseIndex]}
                  </motion.h2>
                </AnimatePresence>
              </div>
            )}

            {/* CREAMY ANIMATIONS: The Waterfall Result */}
            {result && !loadingPlan && (
              <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} style={{ width: "100%" }}>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <h1 style={{ fontSize: "40px", fontWeight: "700", letterSpacing: "-0.03em", lineHeight: "1.2", color: "#111", margin: 0 }}>{result.title}</h1>
                    <button onClick={() => generateSpeech(result.title + ". " + result.hook)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "50%", padding: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s" }} className="hover:bg-blue-100 hover:text-blue-600 hover:border-blue-200">
                      <Volume2 size={24} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>{result.subtitle}</span>
                    <span style={{ background: "#111", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><Glasses size={12} /> AI Architect</span>
                  </div>
                </motion.div>

                {/* INTELLIGENT MARKDOWN (THE "ISLAND" EFFECT) */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }} style={{ background: "#18181b", padding: "32px", borderRadius: "24px", color: "white", marginBottom: "16px", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)" }}>
                  <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Desi Cognitive Hook</h3>
                  <p style={{ fontSize: "20px", fontWeight: "500", lineHeight: "1.6", letterSpacing: "-0.01em", margin: 0 }}>&quot;{result.hook}&quot;</p>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }} style={styles.card}>
                  <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Engagement Strategy</h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#334155", margin: 0 }}>{result.strategy}</p>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                  {result.groups.map((g, i) => (
                    <div key={i} style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 10px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{g.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px", fontWeight: "500" }}>{g.students}</div>
                      <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#475569" }}>{g.task}</div>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }} style={{ background: "#0f172a", borderRadius: "24px", overflow: "hidden", height: "460px", marginBottom: "32px", border: "1px solid #1e293b", position: "relative" }}>
                  {result.isVR ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)", color: "white", cursor: "pointer" }} onClick={() => setShowVR(true)}>
                      <Glasses size={64} style={{ marginBottom: "20px", color: "#38bdf8" }} />
                      <h2 style={{ fontSize: "24px", fontWeight: "600" }}>Immersive Lab</h2><button style={{ background: "white", color: "black", padding: "10px 24px", borderRadius: "30px", border: "none", fontWeight: "600", marginTop: "20px" }}>Enter XR</button>
                    </div>
                  ) : result.visual_type === "image" ? (
                    <div style={{ width: "100%", height: "100%", background: "#f8fafc", position: "relative" }}>
                      <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.7)", padding: "6px 12px", borderRadius: "20px", color: "white", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><ImageIcon size={14} /> Textbook Diagram</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.visual_url || `https://image.pollinations.ai/prompt/${encodeURIComponent(result.visual_prompt || "")}?width=800&height=500&nologo=true`} alt="Visual" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "absolute", top: 0, left: 0, width: "100%", zIndex: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.5)", padding: "6px 12px", borderRadius: "20px", backdropFilter: "blur(10px)" }}><MonitorPlay size={14} color="#38bdf8" /><span style={{ color: "white", fontSize: "12px", fontWeight: "600" }}>WIDGET (H5)</span></div>
                      </div>
                      {simulationCode && <iframe srcDoc={simulationCode} style={{ width: "100%", height: "100%", border: "none", background: "#f8fafc" }} title="Simulation" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups" />}
                    </div>
                  )}
                </motion.div>

                {/* USER & AI CHAT FLOW (Spring Physics) */}
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    {msg.role === "user" ? (
                      <div style={{ background: "#f1f5f9", padding: "16px 24px", borderRadius: "24px", borderBottomRightRadius: "4px", maxWidth: "80%" }}>
                        <p style={{ fontSize: "16px", color: "#0f172a", margin: 0, lineHeight: "1.6", fontWeight: "500" }}>{msg.text}</p>
                      </div>
                    ) : (
                      <div style={{ padding: "0px", maxWidth: "90%", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", marginLeft: "4px" }}>
                          {msg.actionPerformed ? <Sparkles size={14} color="#f59e0b" /> : <Glasses size={14} color="#64748b" />}
                          <span style={{ fontSize: "12px", fontWeight: "700", color: msg.actionPerformed ? "#f59e0b" : "#64748b", textTransform: "uppercase" }}>
                            {msg.actionPerformed ? `Agent → ${msg.actionPerformed.replace(/_/g, " ")}` : "AI Architect"}
                          </span>
                          <button onClick={() => generateSpeech(msg.text)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "all 0.2s", padding: "4px", borderRadius: "50%" }} className="hover:bg-blue-50 hover:text-blue-500">
                            <Volume2 size={16} />
                          </button>
                        </div>
                        {msg.docUrl && (
                          <a href={msg.docUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dbeafe", color: "#1d4ed8", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", textDecoration: "none", marginBottom: "12px", transition: "all 0.2s" }}>
                            <ExternalLink size={14} /> Open Google Doc
                          </a>
                        )}
                        <div className="prose prose-slate max-w-none" style={{ fontSize: "16px", lineHeight: "1.8", color: "#334155", letterSpacing: "-0.01em" }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ node, ...props }) => <p style={{ marginBottom: "16px" }} {...props} />,
                              ul: ({ node, ...props }) => <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }} {...props} />,
                              ol: ({ node, ...props }) => <ol style={{ listStyleType: "decimal", paddingLeft: "24px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }} {...props} />,
                              li: ({ node, ...props }) => <li style={{ lineHeight: "1.6" }} {...props} />,
                              h1: ({ node, ...props }) => <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", marginTop: "24px" }} {...props} />,
                              h2: ({ node, ...props }) => <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "12px", marginTop: "20px" }} {...props} />,
                              h3: ({ node, ...props }) => <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "12px", marginTop: "16px" }} {...props} />,
                              strong: ({ node, ...props }) => <strong style={{ fontWeight: "700", color: "#0f172a", background: "rgba(56, 189, 248, 0.1)", padding: "0 4px", borderRadius: "4px" }} {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: "4px solid #38bdf8", background: "#f8fafc", padding: "12px 16px", margin: "16px 0", borderRadius: "0 8px 8px 0", fontStyle: "italic", color: "#475569" }} {...props} />,
                              code(props) {
                                const { children, className, node, ...rest } = props
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match && !className?.includes('language-');
                                return isInline ? (
                                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px", fontFamily: "monospace", fontSize: "14px", color: "#ec4899", border: "1px solid #e2e8f0" }} {...rest}>
                                    {children}
                                  </code>
                                ) : (
                                  <div style={{ background: "#1e293b", padding: "20px", borderRadius: "16px", margin: "20px 0", overflowX: "auto", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}>
                                    <code style={{ fontFamily: "monospace", fontSize: "14px", color: "#e2e8f0" }} className={className} {...rest}>
                                      {children}
                                    </code>
                                  </div>
                                )
                              }
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {chatLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0", color: "#94a3b8" }}><div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }} className="animate-pulse" /><div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%", animationDelay: "0.2s" }} className="animate-pulse" /><div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%", animationDelay: "0.4s" }} className="animate-pulse" /></motion.div>
                )}
                <div ref={bottomRef} style={{ height: "60px" }} />
              </motion.div>
            )}

          </div>
        )}
      </div>

      {/* --- LAYER 3: THE FLOATING INPUT (SPATIAL LAYOUT) --- */}
      <div
        className="floating-chat-input"
        style={{ position: "fixed", bottom: "30px", marginLeft: "260px", width: "calc(100% - 260px)", display: activeSidebarView === "dashboard" ? "none" : "flex", justifyContent: "center", zIndex: 10, pointerEvents: (!loadingPlan && !result) ? "none" : "auto", opacity: 0 }}
      >
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "24px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 12px 40px rgba(0,0,0,0.08)", width: "90%", maxWidth: "800px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <input
            type="text" placeholder="Make updates to your app..."
            value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
            style={{ width: "100%", border: "none", background: "transparent", fontSize: "16px", outline: "none", color: "#111", padding: "8px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-gray-200"><Plus size={16} /></button>
              <button style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-gray-100">
                <ImageIcon size={14} /> Auto <ChevronDown size={14} />
              </button>
            </div>
            <button onClick={handleChatSend} disabled={chatLoading || !chatInput} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", opacity: (chatLoading || !chatInput) ? 0.5 : 1, transition: "all 0.2s" }}><ArrowUp size={16} strokeWidth={3} /></button>
          </div>
        </div>
      </div>

      {/* --- LAYER 4: IMMERSIVE LAB (VR/VIDEO) --- */}
      <AnimatePresence>
        {showVR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background: "black"
            }}
          >
            <video
              autoPlay
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            >
              <source src="/heart-vr.mp4" type="video/mp4" />
            </video>

            <button
              onClick={() => setShowVR(false)}
              style={{
                position: "absolute",
                top: "40px",
                right: "40px",
                background: "rgba(0,0,0,0.5)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "30px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              className="hover:bg-white hover:text-black"
            >
              Close & Return to Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}