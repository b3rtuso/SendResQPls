import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Bauhaus Geometric Design System ───────────────────────────────────────
   DESIGN_VARIANCE: 8 | MOTION_INTENSITY: 6 | VISUAL_DENSITY: 4
   Font: Inter Tight (condensed geometric sans — Bauhaus lineage)
   Palette: #0D1B2A (bg) · #E63946 (red) · #F4D03F (yellow) · #2563EB (blue) · #FFFFFF
   Shape vocabulary: ● ■ ▲ — only pure geometry, no icons as decoration
   Zero border-radius. Zero gradient. Zero shadow. Zero em-dashes.
   All motion: CSS transform/opacity only, honors prefers-reduced-motion.
─────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [step1Visible, setStep1Visible] = useState(false);
  const [step2Visible, setStep2Visible] = useState(false);
  const [step3Visible, setStep3Visible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [accessVisible, setAccessVisible] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const highlightTimerRef = useRef<any>(null);

  const scrollToAccess = () => {
    const el = document.getElementById('access-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setAccessVisible(true);
    setHighlighted(true);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlighted(false);
    }, 3500);
  };

  useEffect(() => {
    // Trigger hero entrance after mount
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Scroll-reveal via IntersectionObserver (no window scroll listener)
    const targets = [
      { id: 'step-1', setter: setStep1Visible },
      { id: 'step-2', setter: setStep2Visible },
      { id: 'step-3', setter: setStep3Visible },
      { id: 'faq-section', setter: setFaqVisible },
      { id: 'access-section', setter: setAccessVisible },
    ];

    const observers = targets.map(({ id, setter }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setter(true); obs.disconnect(); } },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    });

    return () => observers.forEach(obs => obs?.disconnect());
  }, []);

  const faqs = [
    {
      num: '01',
      color: 'red',
      q: 'Why was SendResQPls developed for Balayan?',
      answers: [
        'Traditional emergency hotlines often suffer from busy queues, misheard street names, and a lack of visual context. During critical emergencies, every second counts.',
        'SendResQPls was created in partnership with MDRRMO Balayan to give citizens a direct digital lifeline: 1-tap incident reporting, automated GPS location pinpointing, and instant photo verification so responders arrive at the exact location faster.',
      ],
      pills: ['Pinpoint GPS', 'Direct Dispatch', 'Photo Verification'],
    },
    {
      num: '02',
      color: 'yellow',
      q: "Doesn't this system require internet? What happens during a disaster blackout?",
      answers: [
        'We engineered SendResQPls with multi-layer disaster resilience to ensure continuous emergency communication:',
        '1. Everyday Critical Incidents: The vast majority of emergencies (road accidents, residential fires, medical trauma, localized flash floods) happen when 4G/5G/Wi-Fi is fully operational.',
        '2. Offline GPS Caching & Auto-Sync: If your cellular data or Wi-Fi drops, the app automatically caches your report and hardware GPS coordinates locally, then silently transmits the moment connectivity returns.',
        '3. Built-In 1-Tap Cellular Hotlines: If there is zero internet connectivity, the app provides direct 1-tap phone call shortcuts to MDRRMO Balayan, BFP, and PNP that work over standard voice networks without data.',
        '4. Pre-Disaster Early Warnings: Used before catastrophic typhoons make landfall to report rising river levels, request preemptive evacuations, and receive official MDRRMO advisories.',
      ],
      pills: ['Offline GPS Caching', '1-Tap Cellular Hotlines', 'Auto-Sync Queue'],
    },
    {
      num: '03',
      color: 'blue',
      q: 'How does the system prevent false reports and AI-generated photos?',
      answers: [
        'To protect emergency resources and prevent pranks or fabricated reports, SendResQPls uses a 4-tier verification framework:',
        '1. AI Synthetic Image Detection: Our AI vision model analyzes uploaded photos for synthetic artifacts, unnatural lighting, and hallmarks of AI generation or web downloads.',
        '2. Live Camera & GPS Binding: Reports require direct in-app camera capture and cross-reference device hardware GPS with the incident scene in Balayan.',
        '3. Verified User Accounts: Anonymous reporting is prohibited. Every account requires phone and email OTP (One-Time Password) verification, creating strict legal accountability.',
        '4. Human Dispatcher Confirmation: AI assists with fast triage, but certified MDRRMO command center officers verify every report before dispatching emergency teams. False reporting is punishable under Philippine law.',
      ],
      pills: ['AI Image Integrity', 'GPS Binding', 'Verified Accounts (OTP)', 'Human Review'],
    },
    {
      num: '04',
      color: 'red',
      q: 'Is SendResQPls 100% free for all citizens?',
      answers: [
        'Yes, 100% free. There are no fees, subscriptions, or premium tiers. It is an official public safety service funded and maintained for the residents and visitors of Balayan, Batangas.',
      ],
      pills: ['Official Municipal Service', '100% Free Public App'],
    },
    {
      num: '05',
      color: 'yellow',
      q: 'How does AI Photo Triage help in an emergency?',
      answers: [
        'When you snap a photo of an incident (fire, flood, or accident), our AI vision system analyzes the image in under 2 seconds to classify the hazard type and estimate the severity score.',
        'This provides dispatchers with an immediate visual summary, ensuring the right specialized equipment (fire engines, rescue boats, or life-support ambulances) is deployed immediately.',
      ],
      pills: ['2-Second AI Triage', 'Specialized Equipment Dispatch'],
    },
    {
      num: '06',
      color: 'blue',
      q: 'Who responds when I submit an emergency report?',
      answers: [
        'Reports go directly to the 24/7 MDRRMO Balayan Command Center. Depending on the emergency type, dispatchers coordinate with:',
        '• MDRRMO Rescue Units (flood, storm, structural rescue)',
        '• Bureau of Fire Protection — BFP Balayan (fires, hazmat)',
        '• Philippine National Police — PNP Balayan (traffic accidents, safety)',
        '• Rural Health Unit (RHU) Ambulance Services (medical trauma)',
      ],
      pills: ['MDRRMO Balayan', 'BFP Fire', 'PNP Police', 'RHU Ambulance'],
    },
  ];

  return (
    <>
      <style>{`
        /* ─── Font ─── */
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0D1B2A;
          --surface: #112236;
          --red:     #E63946;
          --yellow:  #F4D03F;
          --blue:    #2563EB;
          --blue-dk: #1D4ED8;
          --white:   #FFFFFF;
          --text-muted: rgba(255,255,255,0.65);
          --divider: rgba(255,255,255,0.12);
          --font:    'Inter Tight', system-ui, sans-serif;
        }

        .lp-root {
          background: var(--bg);
          color: var(--white);
          font-family: var(--font);
          min-height: 100dvh;
          overflow-x: hidden;
          width: 100%;
        }

        /* ─── NAV ─── */
        .lp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 4vw, 72px);
          height: 64px;
          border-bottom: 1px solid var(--divider);
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 100;
        }
        .lp-nav-logo {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--white);
          text-decoration: none;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-nav-logo-img {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: cover;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
        }
        .lp-nav-shapes {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-shape-circle {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--red);
          flex-shrink: 0;
        }
        .lp-shape-square {
          width: 14px; height: 14px;
          background: var(--yellow);
          flex-shrink: 0;
        }
        .lp-shape-triangle {
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 14px solid var(--blue);
          flex-shrink: 0;
        }
        .lp-nav-location {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* ─── HERO ─── */
        .lp-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100dvh - 64px);
          border-bottom: 1px solid var(--divider);
        }

        /* Hero left */
        .lp-hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(36px, 6vw, 88px) clamp(16px, 5vw, 72px);
          border-right: 1px solid var(--divider);
          position: relative;
          min-width: 0;
        }
        .lp-hero-circle {
          width: clamp(52px, 6.5vw, 100px);
          height: clamp(52px, 6.5vw, 100px);
          border-radius: 50%;
          background: var(--red);
          margin-bottom: clamp(16px, 2.5vw, 32px);
          opacity: 0;
          transform: scale(0.6);
          transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
          flex-shrink: 0;
        }
        .lp-hero-circle.visible {
          opacity: 1;
          transform: scale(1);
        }
        .lp-hero-headline {
          font-size: clamp(36px, 6.5vw, 96px);
          font-weight: 900;
          line-height: 0.96;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--white);
          margin-top: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s;
        }
        .lp-hero-headline.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-hero-rule {
          height: 6px;
          background: var(--yellow);
          border: none;
          margin: clamp(18px, 2.5vw, 28px) 0;
          width: 100%;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.5s ease 0.4s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s;
        }
        .lp-hero-rule.visible {
          opacity: 1;
          transform: scaleX(1);
        }
        .lp-hero-tagline {
          font-size: clamp(14px, 1.3vw, 17px);
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 520px;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.55s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s;
        }
        .lp-hero-tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-hero-ctas {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: clamp(24px, 3vw, 36px);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.7s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.7s;
          flex-wrap: wrap;
        }
        .lp-hero-ctas.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── BUTTONS ─── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: var(--blue);
          color: var(--white);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, transform 0.1s ease;
        }
        .btn-primary:hover { background: var(--blue-dk); }
        .btn-primary:active { transform: translateY(1px); }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: transparent;
          color: var(--white);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, border-color 0.15s linear, transform 0.1s ease;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.7);
        }
        .btn-outline:active { transform: translateY(1px); }

        .btn-admin {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: #0D1B2A;
          color: #FFFFFF;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, transform 0.1s ease;
        }
        .btn-admin:hover { background: #1a2f45; }
        .btn-admin:active { transform: translateY(1px); }

        /* Hero right */
        .lp-hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.8s ease 0.3s;
          background: #07111D;
        }
        .lp-hero-right.visible { opacity: 1; }
        .lp-hero-right img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ─── TICKER ─── */
        .lp-ticker {
          border-bottom: 1px solid var(--divider);
          overflow: hidden;
          height: 48px;
          display: flex;
          align-items: center;
          position: relative;
          user-select: none;
          mask-image: linear-gradient(to right, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%);
          background: var(--bg);
        }
        .lp-ticker-track {
          display: flex;
          width: max-content;
          flex-shrink: 0;
          animation: ticker 30s linear infinite;
          will-change: transform;
        }
        .lp-ticker:hover .lp-ticker-track {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .lp-ticker-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .lp-ticker-item {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 clamp(16px, 2.5vw, 36px);
          white-space: nowrap;
        }
        .lp-ticker-dot {
          color: var(--yellow);
        }

        /* ─── HOW IT WORKS ─── */
        .lp-how {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--divider);
        }
        .lp-how-cell {
          padding: clamp(32px, 5vw, 64px) clamp(20px, 3.5vw, 48px);
          border-right: 1px solid var(--divider);
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
          min-width: 0;
        }
        .lp-how-cell:last-child { border-right: none; }
        .lp-how-cell.visible { opacity: 1; transform: translateY(0); }
        #step-2.visible { transition-delay: 0.1s; }
        #step-3.visible { transition-delay: 0.2s; }

        .lp-how-num {
          font-size: clamp(48px, 6vw, 84px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .lp-how-num.red { color: var(--red); }
        .lp-how-num.yellow { color: var(--yellow); }
        .lp-how-num.blue { color: var(--blue); }

        .lp-how-heading {
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 16px;
          color: var(--white);
        }
        .lp-how-body {
          font-size: 14.5px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          margin-top: 12px;
          max-width: 320px;
          width: 100%;
        }
        .lp-how-shape {
          margin-top: 32px;
        }

        /* ─── FAQ SECTION ─── */
        .lp-faq {
          border-bottom: 1px solid var(--divider);
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
          padding: clamp(48px, 6vw, 96px) clamp(20px, 5vw, 72px);
          position: relative;
        }
        .lp-faq.visible { opacity: 1; transform: translateY(0); }

        .lp-faq-header {
          margin-bottom: clamp(32px, 4vw, 56px);
        }
        .lp-faq-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .lp-faq-shapes {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-faq-shape-sq {
          width: 10px; height: 10px;
          background: var(--red);
          flex-shrink: 0;
        }
        .lp-faq-shape-circle {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--yellow);
          flex-shrink: 0;
        }
        .lp-faq-title {
          font-size: clamp(28px, 4vw, 52px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: var(--white);
        }

        .lp-faq-list {
          display: flex;
          flex-direction: column;
          border-top: 1px solid var(--divider);
        }
        .lp-faq-item {
          border-bottom: 1px solid var(--divider);
          transition: background 0.2s ease;
        }
        .lp-faq-item.open {
          background: rgba(255, 255, 255, 0.02);
        }
        .lp-faq-trigger {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: clamp(20px, 3vw, 32px) 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          font-family: var(--font);
          color: var(--white);
          transition: opacity 0.15s ease;
        }
        .lp-faq-trigger:hover {
          opacity: 0.9;
        }
        .lp-faq-trigger-left {
          display: flex;
          align-items: baseline;
          gap: clamp(14px, 2.5vw, 28px);
          min-width: 0;
        }
        .lp-faq-num {
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 900;
          font-family: var(--font);
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }
        .lp-faq-num.red { color: var(--red); }
        .lp-faq-num.yellow { color: var(--yellow); }
        .lp-faq-num.blue { color: var(--blue); }

        .lp-faq-q {
          font-size: clamp(16px, 2.2vw, 22px);
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.25;
          color: var(--white);
        }
        .lp-faq-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--white);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-faq-item.open .lp-faq-icon {
          background: var(--blue);
          border-color: var(--blue);
          color: #FFFFFF;
          transform: rotate(45deg);
        }
        .lp-faq-body {
          padding-left: clamp(30px, 4.5vw, 56px);
          padding-bottom: clamp(24px, 3.5vw, 36px);
          padding-right: clamp(16px, 2vw, 40px);
          animation: alFadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-faq-text {
          font-size: clamp(14px, 1.4vw, 15.5px);
          font-weight: 400;
          line-height: 1.7;
          color: var(--text-muted);
          max-width: 860px;
        }
        .lp-faq-text p + p {
          margin-top: 10px;
        }
        .lp-faq-pill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .lp-faq-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }

        /* ─── ACCESS PORTAL ─── */
        @keyframes spotlightCitizen {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.8), inset 0 0 40px rgba(37, 99, 235, 0.2);
            transform: scale(1);
          }
          20% {
            box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.9), 0 20px 60px rgba(37, 99, 235, 0.45), inset 0 0 50px rgba(37, 99, 235, 0.35);
            transform: scale(1.012);
            background: #112948;
          }
          50% {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.6), 0 12px 40px rgba(37, 99, 235, 0.3), inset 0 0 35px rgba(37, 99, 235, 0.25);
            transform: scale(1.006);
            background: #0f2440;
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0), inset 0 0 0 transparent;
            transform: scale(1);
            background: transparent;
          }
        }

        @keyframes pulseBtnFocus {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37,99,235,0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(37,99,235,0); }
        }

        .lp-spotlight-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 16px;
          background: #2563EB;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(37,99,235,0.5);
          animation: alFadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lp-access {
          border-bottom: 1px solid var(--divider);
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-access.visible { opacity: 1; transform: translateY(0); }

        /* Citizen side */
        .lp-access-citizen {
          padding: clamp(40px, 6vw, 88px) clamp(20px, 5vw, 72px);
          min-width: 0;
          transition: all 0.35s ease;
          position: relative;
        }
        .lp-access-citizen.highlighted {
          z-index: 5;
          animation: spotlightCitizen 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lp-access-citizen.highlighted .btn-primary {
          animation: pulseBtnFocus 1s ease-in-out 3;
        }
        .lp-access-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .lp-access-label-square {
          width: 10px; height: 10px;
          background: var(--white);
          flex-shrink: 0;
        }
        .lp-access-heading {
          font-size: clamp(26px, 3.2vw, 44px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: var(--white);
          margin-bottom: 16px;
        }
        .lp-access-body {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 560px;
          width: 100%;
          margin-bottom: 32px;
        }
        .lp-access-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 14px;
          letter-spacing: 0.03em;
        }

        /* ─── FOOTER ─── */
        .lp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 72px);
          height: 56px;
          border-top: 1px solid var(--divider);
        }
        .lp-footer-copy {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .lp-footer-shapes {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ─── RESPONSIVE BREAKPOINTS ─── */
        @media (max-width: 960px) {
          .lp-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .lp-hero-left {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }
          .lp-hero-right {
            height: clamp(260px, 50vw, 420px);
            width: 100%;
            border-right: none;
          }
          .lp-how {
            grid-template-columns: 1fr;
          }
          .lp-how-cell {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }
          .lp-how-cell:last-child {
            border-bottom: none;
          }
          .lp-how-body {
            max-width: 100%;
          }
          .lp-access {
            grid-template-columns: 1fr;
          }
          .lp-access-citizen {
            border-right: none;
            border-bottom: 2px solid rgba(255,255,255,0.18);
          }
        }

        @media (max-width: 640px) {
          .lp-nav-location {
            display: none;
          }
          .lp-hero-headline {
            font-size: clamp(34px, 11vw, 56px);
            line-height: 1.0;
          }
          .lp-hero-ctas {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            gap: 12px;
          }
          .lp-cta-divider {
            display: none;
          }
          .btn-primary, .btn-outline, .btn-admin {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .lp-footer {
            flex-direction: column;
            gap: 12px;
            height: auto;
            padding: 20px clamp(16px, 4vw, 32px);
            text-align: center;
          }
        }

        @media (max-width: 420px) {
          .lp-nav-shapes {
            display: none;
          }
          .lp-hero-headline {
            font-size: 32px;
          }
          .lp-hero-circle {
            width: 44px;
            height: 44px;
            margin-bottom: 14px;
          }
        }
      `}</style>

      <div className="lp-root" ref={heroRef}>

        {/* ─── NAV ─── */}
        <nav className="lp-nav">
          <a href="/" className="lp-nav-logo">
            <img src="/logo.jpg" alt="SendResQPls Logo" className="lp-nav-logo-img" />
            <span>SendResQPls</span>
          </a>
          <div className="lp-nav-shapes">
            <div className="lp-shape-circle" aria-hidden="true" />
            <div className="lp-shape-square" aria-hidden="true" />
            <div className="lp-shape-triangle" aria-hidden="true" />
          </div>
          <span className="lp-nav-location">MDRRMO · Balayan</span>
        </nav>

        {/* ─── HERO ─── */}
        <section className="lp-hero">
          {/* Left */}
          <div className="lp-hero-left">
            <div className={`lp-hero-circle ${heroVisible ? 'visible' : ''}`} aria-hidden="true" />

            <h1 className={`lp-hero-headline ${heroVisible ? 'visible' : ''}`}>
              Emergency<br />Response
            </h1>

            <hr className={`lp-hero-rule ${heroVisible ? 'visible' : ''}`} />

            <p className={`lp-hero-tagline ${heroVisible ? 'visible' : ''}`}>
              Digital emergency reporting for the citizens of Balayan, Batangas.
              Report incidents. Get help fast.
            </p>

            <div className={`lp-hero-ctas ${heroVisible ? 'visible' : ''}`}>
              <button
                className="btn-primary"
                onClick={scrollToAccess}
                aria-label="Scroll down to get the app section"
              >
                Get the App
              </button>
            </div>
          </div>

          {/* Right — generated Bauhaus hero image */}
          <div className={`lp-hero-right ${heroVisible ? 'visible' : ''}`} aria-hidden="true">
            <img
              src="/bauhaus-hero.jpg"
              alt="SendResQPls mobile app — Bauhaus geometric composition"
              loading="eager"
            />
          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {/* Two identical groups for seamless -50% translation */}
            {[0, 1].map(groupIdx => (
              <div key={groupIdx} className="lp-ticker-group">
                {[0, 1, 2, 3].map(seqIdx => (
                  <span key={seqIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span className="lp-ticker-item">Report</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Dispatch</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Respond</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Protect</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">MDRRMO Balayan</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section className="lp-how">
          <div id="step-1" className={`lp-how-cell ${step1Visible ? 'visible' : ''}`}>
            <div className="lp-how-num red">01</div>
            <h2 className="lp-how-heading">Report</h2>
            <p className="lp-how-body">
              Photograph the emergency. The AI system classifies incident type and severity, then routes your report to the correct response team.
            </p>
            <div className="lp-how-shape">
              <div style={{ width: 20, height: 20, background: 'var(--red)' }} aria-hidden="true" />
            </div>
          </div>

          <div id="step-2" className={`lp-how-cell ${step2Visible ? 'visible' : ''}`}>
            <div className="lp-how-num yellow">02</div>
            <h2 className="lp-how-heading">Dispatch</h2>
            <p className="lp-how-body">
              MDRRMO command center reviews the report, confirms priority, and dispatches the nearest qualified response team to your location.
            </p>
            <div className="lp-how-shape">
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--yellow)' }} aria-hidden="true" />
            </div>
          </div>

          <div id="step-3" className={`lp-how-cell ${step3Visible ? 'visible' : ''}`}>
            <div className="lp-how-num blue">03</div>
            <h2 className="lp-how-heading">Respond</h2>
            <p className="lp-how-body">
              Trained emergency responders arrive on-site. You receive real-time status updates through the app until the incident is resolved.
            </p>
            <div className="lp-how-shape">
              <div style={{
                width: 0, height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '18px solid var(--blue)'
              }} aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ─── FAQ SECTION ─── */}
        <section id="faq-section" className={`lp-faq ${faqVisible ? 'visible' : ''}`}>
          <div className="lp-faq-header">
            <div className="lp-faq-eyebrow">
              <div className="lp-faq-shapes" aria-hidden="true">
                <div className="lp-faq-shape-sq" />
                <div className="lp-faq-shape-circle" />
              </div>
              <span>Common Inquiries</span>
            </div>
            <h2 className="lp-faq-title">Frequently Asked Questions</h2>
          </div>

          <div className="lp-faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.num} className={`lp-faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="lp-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                  >
                    <div className="lp-faq-trigger-left">
                      <span className={`lp-faq-num ${faq.color}`}>{faq.num} /</span>
                      <span className="lp-faq-q">{faq.q}</span>
                    </div>
                    <div className="lp-faq-icon" aria-hidden="true">
                      +
                    </div>
                  </button>

                  {isOpen && (
                    <div id={`faq-answer-${idx}`} className="lp-faq-body">
                      <div className="lp-faq-text">
                        {faq.answers.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                      {faq.pills && (
                        <div className="lp-faq-pill-list">
                          {faq.pills.map((pill, pillIdx) => (
                            <span key={pillIdx} className="lp-faq-pill">
                              {pill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── ACCESS PORTAL ─── */}
        <section id="access-section" className={`lp-access ${accessVisible ? 'visible' : ''}`}>
          {/* Citizen */}
          <div id="access-citizen" className={`lp-access-citizen ${highlighted ? 'highlighted' : ''}`}>
            {highlighted && (
              <div className="lp-spotlight-pill">
                👉 Tap below to download the app
              </div>
            )}
            <div className="lp-access-label">
              <div className="lp-access-label-square" aria-hidden="true" />
              Citizen Access
            </div>
            <h2 className="lp-access-heading">Get the App</h2>
            <p className="lp-access-body">
              Free to use. Report emergencies, track response status, and receive real-time alerts — all from your phone.
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                navigate('/get-the-app');
              }}
              aria-label="Get the SendResQPls mobile app"
            >
              Get It Here
            </button>
            <p className="lp-access-sub">Available for Android devices (APK)</p>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="lp-footer">
          <span className="lp-footer-copy">
            &copy; 2026 MDRRMO Balayan, Batangas
          </span>
          <div className="lp-footer-shapes" aria-hidden="true">
            <div className="lp-shape-circle" />
            <div className="lp-shape-square" />
            <div className="lp-shape-triangle" />
          </div>
        </footer>

      </div>
    </>
  );
}
