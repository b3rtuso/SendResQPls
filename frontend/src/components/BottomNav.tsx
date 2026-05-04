import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Clock, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/mobile" end className={({ isActive }) => isActive ? 'active' : ''}>
        <div className="nav-icon-wrapper"><Home size={22} /></div>
        Home
      </NavLink>
      <NavLink to="/mobile/report" className={({ isActive }) => isActive ? 'active' : ''}>
        <div className="nav-icon-wrapper"><PlusCircle size={22} /></div>
        Report
      </NavLink>
      <NavLink to="/mobile/history" className={({ isActive }) => isActive ? 'active' : ''}>
        <div className="nav-icon-wrapper"><Clock size={22} /></div>
        History
      </NavLink>
      <NavLink to="/mobile/profile" className={({ isActive }) => isActive ? 'active' : ''}>
        <div className="nav-icon-wrapper"><User size={22} /></div>
        Profile
      </NavLink>
    </nav>
  );
}
