'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface TourStep {
  title: string;
  tag: string;
  description: string;
  selector: string;
  mobileSelector?: string;
  tip?: string;
  routeHint?: string;
}

const FREELANCER_STEPS: TourStep[] = [
  {
    title: 'Welcome to POBlancer Workspace',
    tag: 'Dashboard Overview',
    description: 'Your unified command center for freelancing. Monitor ongoing projects, pending orders, revenue, customer chats, and performance statistics in real time.',
    selector: '.page-heading',
    tip: 'Your quick stats, work activity, and live notifications are updated on this screen.'
  },
  {
    title: 'Complete Your Profile',
    tag: 'Profile Setup',
    description: 'Update your avatar, professional headline, hourly rate, skills, and bio. In-depth profiles build customer confidence and rank higher in employer searches.',
    selector: 'aside.account-panel, a[href="#profile"]',
    tip: 'Click "Edit Profile" anytime to update your credentials and public bio.'
  },
  {
    title: 'Add Portfolio & Job Experience',
    tag: 'Portfolio',
    description: 'Showcase past work samples and real client deliverables. POBlancer supports YouTube and Instagram video embeds as well as high-resolution images to showcase real client deliverables.',
    selector: 'nav a[href="#profile"], aside.account-panel',
    tip: 'A strong visual portfolio increases buyer conversion by over 300%.'
  },
  {
    title: 'Create Your First Service Gig',
    tag: 'Gig Creation',
    description: 'Click "+ Submit Service" to launch the Service Editor. Define your title, category, search tags, scope, pricing tiers, and delivery timeline to start receiving buyer orders.',
    selector: 'a.button.primary[href*="service-editor"], .page-heading .button.primary',
    tip: 'Services undergo quality moderation before appearing in search to ensure high marketplace standards.'
  },
  {
    title: 'Understand Service Packages & Add-ons',
    tag: 'Packages & Add-ons',
    description: 'Offer Basic, Standard, and Premium packages. Add high-value extras such as express delivery, source files, or commercial licenses to increase your average order value.',
    selector: 'nav a[href="#addons"], nav a[href="#service-editor"]',
    tip: 'Add-ons provide clients with flexibility while increasing your earnings per project.'
  },
  {
    title: 'Manage Your Services',
    tag: 'Gig Management',
    description: 'Access "My Services" anytime to view active gigs, review order queues, update pricing, pause listings temporarily, or inspect view metrics.',
    selector: 'nav a[href="#listings"], .overview-grid a[href="#listings"]',
    tip: 'Keep your service availability and turnaround times up to date to maintain positive ratings.'
  },
  {
    title: 'Orders & Customer Communication',
    tag: 'Orders & Messages',
    description: 'Review active buyer orders, project milestones, and delivery deadlines. Use the built-in Messages system to collaborate and share draft files with clients.',
    selector: '.overview-grid .panel:first-child, nav a[href="#messages"]',
    tip: 'Always keep project discussions within POBlancer to protect your payment assurance.'
  },
  {
    title: 'Payments and Earnings',
    tag: 'Earnings & Payouts',
    description: 'Inspect available balance, cleared revenue, and pending transactions. Request secure withdrawals in Nigerian Naira (NGN) directly to your verified bank account.',
    selector: '.account-panel .balance, nav a[href="#payouts"]',
    tip: 'Withdrawals are processed directly to your verified account once project milestones are approved.'
  },
  {
    title: 'Account Settings & Project Support',
    tag: 'Security & Support',
    description: 'Manage login security, update credentials, submit identity verification documents, and access Project Support if you ever need deadline assistance.',
    selector: 'nav a[href="#support"], .sidebar-foot, .account-menu',
    tip: 'If a project encounters scope or timeline challenges, Project Support offers mediated team assistance.'
  },
  {
    title: 'Email Notifications & Alerts',
    tag: 'Email Notifications',
    description: 'Important order milestones, buyer messages, revision alerts, and payment approvals are sent to your registered email. Check your inbox and spam folder regularly so you never miss an update.',
    selector: '.panel.notifications, .topbar .account-menu',
    tip: 'Mark emails from POBlancer as "Not Spam" to ensure timely delivery.'
  },
  {
    title: "You're Ready to Earn!",
    tag: 'Ready to Launch',
    description: 'You now know the essentials of POBlancer. Next step: complete your profile and publish your first gig to start connecting with employers.',
    selector: '.page-heading',
    tip: 'You can replay this tour anytime from the sidebar or help menu.'
  }
];

const EMPLOYER_STEPS: TourStep[] = [
  {
    title: 'Welcome to the Employer Workspace',
    tag: 'Overview',
    description: 'Your control center for hiring top talent. Coordinate active project postings, received proposals, purchased services, and team communications from one place.',
    selector: '.page-heading',
    tip: 'Monitor incoming proposals, active deliveries, and team expenditure from this dashboard.'
  },
  {
    title: 'Completing & Updating Profile',
    tag: 'Employer Profile',
    description: 'Add your business name, company logo, industry, and description. Verified business profiles attract top-tier freelancers and higher proposal response rates.',
    selector: 'aside.account-panel, a[href="#profile"]',
    tip: 'A complete company profile demonstrates legitimacy and attracts expert professionals.'
  },
  {
    title: 'Finding & Exploring Freelancers & Services',
    tag: 'Talent Discovery',
    description: 'Browse top freelancers and ready-to-order gigs across software engineering, creative design, digital marketing, video production, and business services.',
    selector: '.topbar nav, .brand',
    tip: 'Explore curated categories from the top navigation to view verified POB experts.'
  },
  {
    title: 'Searching, Filtering & Selecting Services',
    tag: 'Search & Filters',
    description: 'Filter services by category, budget range, delivery timeframe, and freelancer rating to pinpoint the exact expertise your project demands.',
    selector: '.topbar nav details:first-of-type, .topbar nav',
    tip: 'Check freelancer reviews and portfolio galleries to ensure the right fit.'
  },
  {
    title: 'Understanding Service Packages & Add-ons',
    tag: 'Packages',
    description: 'Compare Basic, Standard, and Premium deliverables on service listings. Select add-ons like accelerated turnaround or extra revision cycles before checkout.',
    selector: '.overview-grid .panel:first-child',
    tip: 'Review package details carefully to select the tier that meets your scope.'
  },
  {
    title: 'Order Services or Post a Project',
    tag: 'Ordering & Projects',
    description: 'Purchase fixed-price gigs instantly or click "+ Submit Project" to publish a custom project brief and receive competitive proposals from qualified talent.',
    selector: 'a.button.primary[href*="project-editor"], .page-heading .button.primary',
    tip: 'Submitting a project lets freelancers pitch tailored proposals and quotes directly to you.'
  },
  {
    title: 'Direct Client-Freelancer Messaging',
    tag: 'Messaging',
    description: 'Discuss deliverables, share reference files, review progress drafts, and provide feedback directly through the encrypted Messages workspace.',
    selector: 'nav a[href="#messages"]',
    tip: 'Keep all project communication on POBlancer for full transparency and record-keeping.'
  },
  {
    title: 'Monitoring Orders & Delivery Progress',
    tag: 'Order Monitoring',
    description: 'Review incoming proposals, active order status, and submitted milestones. Inspect and approve work before completing orders.',
    selector: '.overview-grid .panel:first-child, nav a[href="#listings"]',
    tip: 'You can request revisions or approve completed work directly inside the order screen.'
  },
  {
    title: 'Statements, Billing & Receipts',
    tag: 'Billing & Statements',
    description: 'Review payment histories, invoices, and detailed statement records for accounting and corporate expenditure tracking.',
    selector: 'nav a[href="#statements"], .account-panel .balance',
    tip: 'Download invoices and financial summaries anytime for your company records.'
  },
  {
    title: 'Real-Time Alerts & Email Updates',
    tag: 'Alerts & Security',
    description: 'Get instant notifications and email updates whenever a freelancer submits a proposal, sends a message, or uploads work. Check your registered email regularly.',
    selector: '.panel.notifications, .sidebar-foot',
    tip: 'Check your spam or promotions tab to ensure you receive project delivery alerts.'
  },
  {
    title: 'Where to Get Help or Contact Support',
    tag: 'Help & Support',
    description: 'Access Project Support for milestone mediation, order resolution, or platform assistance whenever your team requires guidance.',
    selector: 'nav a[href="#support"], .workspace-footer a[href*="contact"]',
    tip: 'Our support team is available to assist with contract questions or custom enterprise requirements.'
  }
];

interface DashboardTourProps {
  role: 'freelancer' | 'employer';
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardTour({ role, userName, isOpen: externalOpen, onClose }: DashboardTourProps) {
  const steps = role === 'employer' ? EMPLOYER_STEPS : FREELANCER_STEPS;
  const storageKey = `poblancer_tour_${role}_completed`;
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const dialogId = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevFocusedElement = useRef<HTMLElement | null>(null);

  const active = externalOpen !== undefined ? externalOpen : internalOpen;

  // Check first-time visitor auto-launch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const completed = localStorage.getItem(storageKey);
      if (!completed && externalOpen === undefined) {
        // Auto launch on first visit after dashboard loads
        const timer = setTimeout(() => {
          setInternalOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [storageKey, externalOpen]);

  // Screen size listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth <= 680);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleClose = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
    setInternalOpen(false);
    if (onClose) onClose();
    if (prevFocusedElement.current) {
      prevFocusedElement.current.focus();
    }
  }, [storageKey, onClose]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Element measurement & scrolling
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    prevFocusedElement.current = document.activeElement as HTMLElement;

    const findTarget = () => {
      const selectors = currentStep.selector.split(',').map(s => s.trim());
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          // Verify visibility
          if (rect.width > 0 && rect.height > 0) {
            return { el, rect };
          }
        }
      }
      return null;
    };

    const found = findTarget();
    if (found) {
      found.el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      // Re-measure after scroll
      const update = () => {
        const r = found.el.getBoundingClientRect();
        setTargetRect(r);
      };
      const raf = requestAnimationFrame(update);
      const timer = setTimeout(update, 300);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      setTargetRect(null);
    }
  }, [active, currentStepIndex, currentStep]);

  // Window resize & scroll updating target position
  useEffect(() => {
    if (!active || !targetRect) return;
    const handleScroll = () => {
      const selectors = currentStep.selector.split(',').map(s => s.trim());
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el instanceof HTMLElement) {
          setTargetRect(el.getBoundingClientRect());
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [active, currentStep, targetRect]);

  // Keyboard navigation & accessibility focus trap
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentStepIndex < steps.length - 1) {
          e.preventDefault();
          setCurrentStepIndex(i => i + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentStepIndex > 0) {
          e.preventDefault();
          setCurrentStepIndex(i => i - 1);
        }
      } else if (e.key === 'Tab') {
        // Focus trap
        const container = tooltipRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, currentStepIndex, steps.length, handleClose]);

  // Initial focus on tooltip primary action
  useEffect(() => {
    if (active && tooltipRef.current) {
      const btn = tooltipRef.current.querySelector<HTMLButtonElement>('.tour-btn-next');
      btn?.focus();
    }
  }, [active, currentStepIndex]);

  if (!active) return null;

  // Calculate Tooltip Positioning (desktop)
  let tooltipStyle: React.CSSProperties = {};
  let placement = 'bottom';

  if (!isMobile && targetRect) {
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipWidth = 360;
    const tooltipHeight = 240; // estimated max

    // Check bottom space
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = 0;
    let left = 0;

    if (spaceBelow >= tooltipHeight + margin) {
      top = targetRect.bottom + margin;
      placement = 'bottom';
    } else if (spaceAbove >= tooltipHeight + margin) {
      top = targetRect.top - tooltipHeight - margin;
      placement = 'top';
    } else {
      // Centered fallback
      top = Math.max(margin, Math.min(vh - tooltipHeight - margin, targetRect.top));
      placement = 'side';
    }

    // Align left with target, clamp within screen
    left = targetRect.left;
    if (left + tooltipWidth > vw - margin) {
      left = vw - tooltipWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    tooltipStyle = {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10002
    };
  } else {
    // Mobile bottom drawer placement
    tooltipStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '14px',
      right: '14px',
      margin: '0 auto',
      maxWidth: '440px',
      zIndex: 10002
    };
  }

  const isLast = currentStepIndex === steps.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="pob-tour-root" aria-live="polite">
      {/* Backdrop overlay */}
      <div 
        className="pob-tour-backdrop" 
        onClick={handleClose} 
        aria-hidden="true" 
      />

      {/* Spotlight cutout if target is present and visible */}
      {targetRect && targetRect.width > 0 && (
        <div
          className="pob-tour-spotlight"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
          aria-hidden="true"
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        ref={tooltipRef}
        className={`pob-tour-card placement-${placement}`}
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-desc`}
      >
        {/* Header with progress & close */}
        <div className="tour-card-header">
          <div className="tour-card-badge-group">
            <span className="tour-card-badge">{currentStep.tag}</span>
            <span className="tour-card-step" aria-label={`Step ${currentStepIndex + 1} of ${steps.length}`}>
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <button
            type="button"
            className="tour-btn-close"
            onClick={handleClose}
            aria-label="Skip and close guided tour"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="tour-progress-track" aria-hidden="true">
          <div 
            className="tour-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body content */}
        <div className="tour-card-body">
          <h2 id={`${dialogId}-title`} className="tour-title">
            {currentStep.title}
          </h2>
          <p id={`${dialogId}-desc`} className="tour-desc">
            {currentStep.description}
          </p>
          {currentStep.tip && (
            <div className="tour-tip">
              <span className="tour-tip-icon" aria-hidden="true">💡</span>
              <span>{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="tour-card-footer">
          <button
            type="button"
            className="tour-btn-skip"
            onClick={handleClose}
          >
            Skip Tour
          </button>

          <div className="tour-nav-group">
            {currentStepIndex > 0 && (
              <button
                type="button"
                className="tour-btn-prev"
                onClick={() => setCurrentStepIndex(i => i - 1)}
                aria-label="Previous step"
              >
                Previous
              </button>
            )}

            <button
              type="button"
              className="tour-btn-next button primary"
              onClick={() => {
                if (isLast) {
                  handleClose();
                } else {
                  setCurrentStepIndex(i => i + 1);
                }
              }}
            >
              {isLast ? 'Finish Tour ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
