import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { DashboardSlideshow } from "../common/DashboardSlideshow";
import { CalendarWidget } from "../common/CalendarWidget";
import { AnnouncementsCarousel } from "../common/AnnouncementsCarousel";
import {
  IconGraduationCap,
  IconCalendar,
  IconCalendarOff,
  IconFileText,
  IconBookOpen,
  IconMegaphone,
  IconLifeBuoy,
  IconMessageSquare,
  IconZap,
  IconBell,
  IconArrowRight,
} from "../common/Icons";

export function StudentHome({ user, setActiveTab, addToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [contentCount, setContentCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadHomeData();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(clockInterval);
  }, []);

  const loadHomeData = async () => {
    try {
      const [annRes, contRes, assignRes, leaveRes] = await Promise.all([
        apiRequest("/announcements/"),
        apiRequest("/content/"),
        apiRequest("/assignments/"),
        apiRequest("/leaves/"),
      ]);
      const annList = annRes.data?.results || annRes.data || [];
      setAnnouncements(annList);
      const contList = contRes.data?.results || contRes.data || [];
      setContentCount(contList.length);
      const assignList = assignRes.data?.results || assignRes.data || [];
      setAssignmentCount(assignList.length);
      const leavesList = leaveRes.data?.results || leaveRes.data || [];
      setLeaveCount(leavesList.length);
    } catch {
      // Fallback
    }
  };

  const handleReadAnnouncement = async (ann) => {
    try {
      await apiRequest(`/announcements/${ann.id}/read/`, { method: "POST" });
      setActiveTab("announcements");
    } catch {
      setActiveTab("announcements");
    }
  };

  // Dynamic greeting
  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  // Slideshow Slides Definition for Student
  const studentHeroSlides = [
    {
      id: "welcome-slide",
      theme: "indigo",
      badge: "STUDENT PORTAL",
      badgeExtra: "SPRING 2026",
      badgeIcon: <IconGraduationCap size={14} />,
      title: `${getGreeting()}, ${user.name || "Student"}!`,
      description: `Welcome to your academic command center. You are actively enrolled in ${user.course || "Computer Science"} (Batch ${user.batch || "2024-2028"}).`,
      tags: [
        `ID: ${user.student_id}`,
        user.portal_email || user.personal_email || "Campus Student",
        "Active Status",
      ],
      primaryBtn: {
        label: "View Timetable",
        icon: <IconCalendar size={16} />,
        action: () => setActiveTab("timetable"),
      },
      secondaryBtn: {
        label: "My Assignments",
        icon: <IconFileText size={16} />,
        action: () => setActiveTab("assignments"),
      },
      cardRight: (
        <div className="slide-glass-card">
          <div className="slide-glass-header">
            <span className="slide-glass-title">STUDENT IDENTITY</span>
            <IconZap size={16} />
          </div>
          <div>
            <span style={{ fontSize: "11px", opacity: 0.8, display: "block" }}>STUDENT ID</span>
            <div style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: 800 }}>{user.student_id}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
            <span className="badge badge-success" style={{ fontSize: "10.5px" }}>Active Enrollment</span>
            <span style={{ fontSize: "11.5px", opacity: 0.9 }}>
              {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "announcements-slide",
      theme: "sunset",
      badge: "CAMPUS NOTICE",
      badgeExtra: "LIVE BROADCAST",
      badgeIcon: <IconMegaphone size={14} />,
      title: announcements.length > 0 ? announcements[0].title : "Campus Alerts & Broadcasts",
      description: announcements.length > 0
        ? announcements[0].content.slice(0, 150) + (announcements[0].content.length > 150 ? "..." : "")
        : "Check official university announcements, schedule changes, and examination hall tickets here.",
      tags: [
        announcements.length > 0 ? `By: ${announcements[0].author_name || "Admin"}` : "Official Notice",
        "Academic Wire",
        "Notice Board",
      ],
      primaryBtn: {
        label: "Browse Notices",
        icon: <IconMegaphone size={16} />,
        action: () => setActiveTab("announcements"),
      },
      secondaryBtn: {
        label: "Help Desk",
        icon: <IconLifeBuoy size={16} />,
        action: () => setActiveTab("tickets"),
      },
      cardRight: (
        <div className="slide-glass-card">
          <div className="slide-glass-header">
            <span className="slide-glass-title">BULLETIN BOARD</span>
            <IconBell size={16} />
          </div>
          <div className="slide-glass-stat">
            {announcements.length} <span style={{ fontSize: "14px", fontWeight: 500 }}>Live</span>
          </div>
          <div className="slide-glass-sub">
            {announcements.length > 0 ? "Latest published today" : "No active alerts"}
          </div>
        </div>
      ),
    },
    {
      id: "vault-slide",
      theme: "emerald",
      badge: "DIGITAL E-VAULT",
      badgeExtra: "INSTANT ACCESS",
      badgeIcon: <IconBookOpen size={14} />,
      title: "Course Materials & Study Vault",
      description: "Download authorized lecture notes, syllabus documents, lab guides, and curated reference textbooks uploaded by your department.",
      tags: [
        `${contentCount} Materials Ready`,
        "PDFs & Documents",
        "Cloud Storage",
      ],
      primaryBtn: {
        label: "Open E-Vault",
        icon: <IconBookOpen size={16} />,
        action: () => setActiveTab("content"),
      },
      secondaryBtn: {
        label: "Leave Application",
        icon: <IconCalendarOff size={16} />,
        action: () => setActiveTab("leaves"),
      },
      cardRight: (
        <div className="slide-glass-card">
          <div className="slide-glass-header">
            <span className="slide-glass-title">E-LEARNING VAULT</span>
            <IconBookOpen size={16} />
          </div>
          <div className="slide-glass-stat">
            {contentCount} <span style={{ fontSize: "14px", fontWeight: 500 }}>Resources</span>
          </div>
          <div className="slide-glass-sub">
            Verified academic files
          </div>
        </div>
      ),
    },
    {
      id: "tasks-slide",
      theme: "ocean",
      badge: "COURSEWORK & LABS",
      badgeExtra: "DEADLINE MONITOR",
      badgeIcon: <IconFileText size={14} />,
      title: "Academic Assignments & Lab Submissions",
      description: "Review assignment criteria, download problem sheets, and submit your deliverables with instant receipt confirmations.",
      tags: [
        `${assignmentCount} Coursework Tasks`,
        "Automated Submissions",
        "Faculty Feedback",
      ],
      primaryBtn: {
        label: "Go to Assignments",
        icon: <IconFileText size={16} />,
        action: () => setActiveTab("assignments"),
      },
      secondaryBtn: {
        label: "Message Staff",
        icon: <IconMessageSquare size={16} />,
        action: () => setActiveTab("messages"),
      },
      cardRight: (
        <div className="slide-glass-card">
          <div className="slide-glass-header">
            <span className="slide-glass-title">TASK MONITOR</span>
            <IconFileText size={16} />
          </div>
          <div className="slide-glass-stat">
            {assignmentCount} <span style={{ fontSize: "14px", fontWeight: 500 }}>Tasks</span>
          </div>
          <div className="slide-glass-sub">
            Online grading & tracking
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Premier Modern Slideshow Hero */}
      <DashboardSlideshow slides={studentHeroSlides} autoPlayInterval={5500} />

      {/* 2. Modernized Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div
          className="modern-stat-card"
          onClick={() => setActiveTab("timetable")}
        >
          <div className="modern-stat-icon-wrapper">
            <IconCalendar size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Routine</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--slate-900)" }}>Class Routine</div>
            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Daily Schedule</span>
              <IconArrowRight size={13} />
            </div>
          </div>
        </div>

        <div
          className="modern-stat-card"
          onClick={() => setActiveTab("assignments")}
        >
          <div className="modern-stat-icon-wrapper">
            <IconFileText size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assignments</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--slate-900)" }}>{assignmentCount} Course Tasks</div>
            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Submit Work</span>
              <IconArrowRight size={13} />
            </div>
          </div>
        </div>

        <div
          className="modern-stat-card"
          onClick={() => setActiveTab("content")}
        >
          <div className="modern-stat-icon-wrapper">
            <IconBookOpen size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>E-Vault</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--slate-900)" }}>{contentCount} Materials</div>
            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Download Files</span>
              <IconArrowRight size={13} />
            </div>
          </div>
        </div>

        <div
          className="modern-stat-card"
          onClick={() => setActiveTab("leaves")}
        >
          <div className="modern-stat-icon-wrapper">
            <IconCalendarOff size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Absence</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--slate-900)" }}>{leaveCount} Leave Requests</div>
            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Apply Leave</span>
              <IconArrowRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Academic Calendar & Event Announcements */}
      <div style={{ marginBottom: "24px" }}>
        <CalendarWidget user={user} addToast={addToast} />
      </div>

      {/* 4. Interactive Announcements Bulletin */}
      <AnnouncementsCarousel
        announcements={announcements}
        onRead={handleReadAnnouncement}
        onViewAll={() => setActiveTab("announcements")}
      />
    </div>
  );
}
