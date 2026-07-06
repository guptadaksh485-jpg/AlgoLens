import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contests", label: "Contests" },
  { to: "/topics", label: "Topics" },
  { to: "/analyze", label: "Analyze Progress" },
  { to: "/planner", label: "Weekly Planner" },
  { to: "/profile", label: "Profile" },
];

const Sidebar = () => {
  return (
    <nav className="hidden w-52 shrink-0 border-r border-zinc-200 bg-white px-3 py-4 sm:block dark:border-zinc-800 dark:bg-zinc-900">
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
