"use client";

import React, { useState } from "react";
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Users,
    BookOpen,
    TrendingUp,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TeacherProfile } from "../app/data";

interface Props {
    teacher: TeacherProfile;
}

const mockAssignments = [
    { id: 1, title: "Chapter 5 Quiz - Algebra", class: "Math 101 - Period 3", submissions: "24/28", status: "Active", date: "2024-01-18" },
    { id: 2, title: "Geometry Homework #12", class: "Math 102 - Period 1", submissions: "18/25", status: "Grading pending", date: "2024-01-20" },
    { id: 3, title: "Midterm Project - Calculus", class: "Math 201 - Period 5", submissions: "30/30", status: "Past due", date: "2024-01-15" },
];

const mockSchedule = [
    { time: "08:00 AM", title: "Math 101 - Period 1", students: 25, subject: "Linear Equations", room: "204", type: "class", duration: 1 },
    { time: "10:30 AM", title: "Math 101 - Period 3", students: 28, subject: "Quadratic Functions", room: "204", type: "class", duration: 1 },
    { time: "12:00 PM", title: "Parent-Teacher Conf", students: 1, subject: "Meeting", room: "Online", type: "meeting", duration: 0.5 },
    { time: "02:00 PM", title: "Math 201 - Period 5", students: 30, subject: "Calculus Intro", room: "206", type: "class", duration: 1 },
];

const mockProgress = [
    { plan: "Algebra Intro", completion: 80, color: "#38bdf8" },
    { plan: "Geometry Basics", completion: 45, color: "#a855f7" },
    { plan: "Calculus Tests", completion: 90, color: "#10b981" },
    { plan: "Parent Meetings", completion: 60, color: "#f59e0b" },
];

export function DashboardView({ teacher }: Props) {
    const [activeTab, setActiveTab] = useState("All");

    return (
        <div style={{
            width: "100%", height: "100%", background: "#06090f", color: "#f8fafc",
            overflowY: "auto", padding: "40px", fontFamily: "Inter, sans-serif"
        }}>
            {/* HEADER OVERVIEW */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                        Good morning, {teacher.name.split(" ")[0]}! 👋
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "15px", margin: 0 }}>
                        You have 3 classes today and 18 assignments waiting to be graded.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{
                        background: "#1e293b", color: "#f8fafc", border: "1px solid #334155",
                        borderRadius: "8px", padding: "10px 16px", fontSize: "14px", fontWeight: "600",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                    }}>
                        <CalendarIcon size={16} /> Filter by Date
                    </button>
                    <button style={{
                        background: "#3b82f6", color: "white", border: "none",
                        borderRadius: "8px", padding: "10px 16px", fontSize: "14px", fontWeight: "600",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                    }}>
                        <Clock size={16} /> Take Attendance
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
                {[
                    { label: "Total Students", value: "124", icon: <Users size={16} color="#94a3b8" /> },
                    { label: "Active Assignments", value: "12", icon: <BookOpen size={16} color="#94a3b8" /> },
                    { label: "To Grade", value: "18", icon: <AlertCircle size={16} color="#f59e0b" /> },
                    { label: "Avg Class Grade", value: "87%", icon: <TrendingUp size={16} color="#10b981" /> },
                    { label: "Attendance Rate", value: "94%", icon: <CheckCircle2 size={16} color="#38bdf8" /> },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px",
                        padding: "20px", display: "flex", flexDirection: "column"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</span>
                            {stat.icon}
                        </div>
                        <div style={{ fontSize: "32px", fontWeight: "700", color: "#f8fafc" }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>

                {/* LEFT MAIN COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* DAILY BANNER */}
                    <div style={{
                        background: "linear-gradient(90deg, #064e3b 0%, #065f46 100%)", borderRadius: "12px",
                        padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
                        border: "1px solid #047857"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ background: "#10b981", borderRadius: "8px", padding: "10px", color: "white" }}>
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <div style={{ color: "#a7f3d0", fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>Today's Schedule - 3 classes</div>
                                <div style={{ color: "white", fontSize: "15px", fontWeight: "500" }}>Period 1 (8:00 AM), Period 3 (10:30 AM), Period 5 (2:00 PM)</div>
                            </div>
                        </div>
                        <button style={{ background: "transparent", border: "none", color: "#6ee7b7", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                            View Calendar
                        </button>
                    </div>

                    {/* TEACHER PROGRESS GRAPHS */}
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#f8fafc" }}>Lecture Plan & Schedule Progress</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {mockProgress.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#cbd5e1", marginBottom: "8px", fontWeight: "500" }}>
                                        <span>{p.plan}</span>
                                        <span>{p.completion}%</span>
                                    </div>
                                    <div style={{ width: "100%", height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }} animate={{ width: `${p.completion}%` }} transition={{ duration: 1, delay: 0.1 * i }}
                                            style={{ height: "100%", background: p.color, borderRadius: "4px" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RECENT ASSIGNMENTS TABLE */}
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#f8fafc" }}>Recent Assignments</h3>
                        </div>

                        <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #1e293b", marginBottom: "20px" }}>
                            {["All", "Active", "Grading", "Completed", "Drafts"].map(tab => (
                                <div
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        paddingBottom: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "500",
                                        color: activeTab === tab ? "#3b82f6" : "#64748b",
                                        borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: "13px" }}>
                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "500" }}>Assignment</th>
                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "500" }}>Submissions</th>
                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "500" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "500" }}>Due Date</th>
                                    <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: "500" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockAssignments.map((a, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #1e293b", transition: "background 0.2s" }} className="hover:bg-slate-800/50">
                                        <td style={{ padding: "16px 8px" }}>
                                            <div style={{ color: "#f8fafc", fontWeight: "500", fontSize: "14px", marginBottom: "4px" }}>{a.title}</div>
                                            <div style={{ color: "#64748b", fontSize: "12px" }}>{a.class}</div>
                                        </td>
                                        <td style={{ padding: "16px 8px" }}>
                                            <div style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "500" }}>{a.submissions}</div>
                                        </td>
                                        <td style={{ padding: "16px 8px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                                                background: a.status === "Active" ? "rgba(16, 185, 129, 0.1)" : a.status === "Past due" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                                color: a.status === "Active" ? "#34d399" : a.status === "Past due" ? "#f87171" : "#fbbf24",
                                                border: `1px solid ${a.status === "Active" ? "rgba(16, 185, 129, 0.2)" : a.status === "Past due" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)"}`
                                            }}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 8px", color: "#94a3b8", fontSize: "14px" }}>{a.date}</td>
                                        <td style={{ padding: "16px 8px", textAlign: "right" }}>
                                            <button style={{ background: "transparent", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                                                View & Grade
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* INTERACTIVE CALENDAR WIDGET */}
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>Today's Classes</h3>
                            <Clock size={16} color="#64748b" />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                            {/* Timeline Line */}
                            <div style={{ position: "absolute", left: "10px", top: "10px", bottom: "10px", width: "2px", background: "#1e293b", zIndex: 0 }} />

                            {mockSchedule.map((item, i) => (
                                <div key={i} style={{
                                    background: item.type === "class" ? "#1e3a8a" : "#3f3f46",
                                    borderRadius: "12px", padding: "16px",
                                    borderLeft: `4px solid ${item.type === "class" ? "#3b82f6" : "#a1a1aa"}`,
                                    position: "relative", zIndex: 1,
                                    display: "flex", flexDirection: "column", gap: "6px",
                                    marginLeft: "24px"
                                }}>
                                    {/* Timeline dot */}
                                    <div style={{
                                        position: "absolute", left: "-21px", top: "20px", width: "10px", height: "10px",
                                        borderRadius: "50%", background: item.type === "class" ? "#3b82f6" : "#a1a1aa",
                                        border: "2px solid #0f172a"
                                    }} />

                                    <div style={{ color: "#f8fafc", fontSize: "15px", fontWeight: "600" }}>{item.title}</div>
                                    <div style={{ color: item.type === "class" ? "#93c5fd" : "#d4d4d8", fontSize: "13px" }}>{item.time} ({item.duration}h)</div>

                                    {item.type === "class" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#bfdbfe", fontSize: "12px" }}>
                                                <Users size={12} /> {item.students} students
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#bfdbfe", fontSize: "12px" }}>
                                                <BookOpen size={12} /> {item.subject}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button style={{
                            width: "100%", background: "#3b82f6", color: "white", padding: "12px",
                            borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px",
                            marginTop: "20px", cursor: "pointer", transition: "background 0.2s"
                        }} className="hover:bg-blue-600">
                            Start next class
                        </button>
                    </div>

                    {/* THIS WEEK AGGREGATES */}
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc", marginBottom: "20px" }}>This Week</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[
                                { label: "Assignments graded", val: "42", color: "#10b981" },
                                { label: "Classes taught", val: "12", color: "#38bdf8" },
                                { label: "Parent messages", val: "7", color: "#fbbf24" },
                                { label: "Avg attendance", val: "96%", color: "#f8fafc" },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                                    <span style={{ color: "#cbd5e1" }}>{item.label}</span>
                                    <span style={{ fontWeight: "700", color: item.color }}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* REMINDERS / ALERTS */}
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>Reminders</h3>
                            <div style={{ background: "#ef4444", color: "white", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>2</div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px" }}>
                                <AlertCircle size={18} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <div>
                                    <div style={{ color: "#f8fafc", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Grade Submission Deadline</div>
                                    <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "12px" }}>Quarter 2 grades due by Friday</div>
                                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: "600" }}>
                                        <span style={{ color: "#ef4444", cursor: "pointer" }}>Postpone</span>
                                        <span style={{ color: "#38bdf8", cursor: "pointer" }}>Mark complete</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px" }}>
                                <AlertCircle size={18} color="#3b82f6" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <div>
                                    <div style={{ color: "#f8fafc", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Parent-Teacher Conferences</div>
                                    <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "12px" }}>Schedule meetings for next week</div>
                                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: "600" }}>
                                        <span style={{ color: "#38bdf8", cursor: "pointer" }}>Schedule</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div >
        </div >
    );
}
