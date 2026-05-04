import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        <div className="search-bar">
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search incidents, reports..." />
        </div>
        <div className="system-status active">
          <span className="dot" />
          System Active
        </div>
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  );
}
