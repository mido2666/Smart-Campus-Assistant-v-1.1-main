import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  Calendar,
  BookOpen,
  Home,
  CalendarCheck,
  Bot,
  Bell,
  UserCheck,
  User,
  ChevronDown,
  Plus,
  Users,
  BarChart3,
  Settings,
  QrCode,
  History,
  X,
  GraduationCap,
  FileText,
  Clock,
  Loader2,
  Menu
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { startTransition } from "react";
import DarkModeToggle from "../DarkModeToggle";
import NotificationBell from "../NotificationBell";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";
import HamburgerMenu from "../HamburgerMenu";
import { useLogout } from "../../hooks/useLogout";
import { useNotifications } from "../../hooks/useNotifications";
import { useResponsive } from "../../utils/responsive";
import {
  comprehensiveSearch,
  debounce,
  formatSearchMetadata,
  type SearchResult,
  type SearchMetadata,
} from "../../utils/search";
import { createPreloadHandler, preloadRoute } from "../../utils/routePreloader";
import logo from '../../assets/logo-new.png';

interface UnifiedNavbarProps {
  userName?: string;
  userAvatar?: string;
  userType?: "student" | "professor";
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const studentNavItems = [
  { icon: Home, Tag: "Dashboard", path: "/student-dashboard" },
  { icon: BookOpen, Tag: "My Courses", path: "/student-courses" },
  { icon: Calendar, Tag: "Schedule", path: "/schedule" },
  {
    icon: UserCheck,
    Tag: "Attendance",
    path: "/attendance",
    hasSubmenu: true,
    submenu: [
      { icon: History, Tag: "Attendance History", path: "/attendance?view=history" },
    ],
  },
  { icon: Bot, Tag: "AI Assistant", path: "/student-ai-assistant" },
  { icon: User, Tag: "Profile", path: "/profile" },
];

const professorNavItems = [
  { icon: Home, Tag: "Dashboard", path: "/professor-dashboard" },
  { icon: BookOpen, Tag: "My Courses", path: "/professor-courses" },
  {
    icon: CalendarCheck,
    Tag: "Attendance",
    path: "/professor-attendance",
    hasSubmenu: true,
    submenu: [
      {
        icon: Plus,
        Tag: "Create Session",
        path: "/professor-attendance/create",
      },
      {
        icon: Users,
        Tag: "Active Sessions",
        path: "/professor-attendance/sessions",
      },
      {
        icon: BarChart3,
        Tag: "Reports",
        path: "/professor-attendance/reports",
      },
      {
        icon: Settings,
        Tag: "Settings",
        path: "/professor-attendance/settings",
      },
    ],
  },
  { icon: Bot, Tag: "AI Assistant", path: "/professor-chatbot" },
  { icon: User, Tag: "Profile", path: "/professor-profile" },
];

export default function UnifiedNavbar({
  userName = "Ahmed Hassan",
  userAvatar,
  userType = "student",
  onMenuToggle,
  isMenuOpen = false,
}: UnifiedNavbarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<
    SearchMetadata["categories"]
  >({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const { logout, isLoading } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();

  // Get real unread notification count - handle missing endpoint gracefully
  const { stats, notifications, loading, error } = useNotifications({
    realTime: true,
    autoConnect: true,
  });

  // Calculate unread count with fallbacks
  const unreadCount = useMemo(() => {
    // Priority 1: Don't show count while loading
    if (loading) {
      return 0;
    }

    // Priority 2: If there's an API error, don't show any count to avoid stale data
    if (error) {
      console.warn('[NotificationBadge] API error detected, hiding badge:', error);
      return 0;
    }

    // Priority 3: Use stats.unread if available and valid (from fresh API response)
    if (stats?.unread !== undefined && typeof stats.unread === "number" && stats.unread >= 0) {
      return stats.unread;
    }

    // Priority 4: Calculate from notifications array ONLY if we have valid data
    if (notifications && Array.isArray(notifications) && notifications.length > 0) {
      const count = notifications.filter((n) => !n.isRead).length;
      return count;
    }

    // Default: No notifications = 0 (don't show badge)
    return 0;
  }, [stats, notifications, loading, error]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Keyboard shortcut for search (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or / to focus search
      if (
        (e.ctrlKey && e.key === "k") ||
        (!e.ctrlKey && e.key === "/" && !isMobile)
      ) {
        e.preventDefault();
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement;

        if (!isInput) {
          searchInputRef.current?.focus();
        }
      }

      // Escape to close search results
      if (e.key === "Escape" && showSearchResults) {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, showSearchResults]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearchResults]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    const success = await logout();
    if (success) {
      setShowToast(true);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleProfileClick = () => {
    const targetPath =
      userType === "student" ? "/profile" : "/professor-profile";
    // Use startTransition for smoother navigation
    startTransition(() => {
      navigate(targetPath);
    });
  };

  const handleSubmenuToggle = (itemPath: string) => {
    setOpenSubmenu(openSubmenu === itemPath ? null : itemPath);
  };

  const handleSubmenuItemClick = (itemPath: string) => {
    // Use startTransition for smoother navigation
    startTransition(() => {
      navigate(itemPath);
    });
    setOpenSubmenu(null);
  };

  // Perform comprehensive search with debouncing
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearchMetadata({});
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const result = await comprehensiveSearch(query, userType);
        setSearchResults(result.results);
        setSearchMetadata(result.metadata.categories);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setSearchMetadata({});
      } finally {
        setIsSearching(false);
      }
    },
    [userType]
  );

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      performSearch(query);
    }, 300)
  ).current;

  // Search functionality
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    setSelectedSearchIndex(-1);

    // Trigger debounced search
    debouncedSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [
        searchQuery.trim(),
        ...recentSearches.filter((s) => s !== searchQuery.trim()),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("recent-searches", JSON.stringify(updated));

      // Navigate to first result if available
      if (searchResults.length > 0 && searchResults[0].url) {
        startTransition(() => {
          navigate(searchResults[0].url);
        });
        setShowSearchResults(false);
        setSearchQuery("");
      } else {
        setShowSearchResults(false);
      }
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0 || recentSearches.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchMetadata({});
    setShowSearchResults(false);
    setSelectedSearchIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setShowSearchResults(true);
    debouncedSearch(search);
  };

  const handleRemoveRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== search);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [
      result.title,
      ...recentSearches.filter((s) => s !== result.title),
    ].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));

    if (result.url) {
      startTransition(() => {
        navigate(result.url);
      });
    }
    setShowSearchResults(false);
    setSearchQuery("");
    setSelectedSearchIndex(-1);
  };

  // Keyboard navigation for search results
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev < Math.max(searchResults.length - 1, 0) ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedSearchIndex >= 0) {
      e.preventDefault();
      if (searchResults[selectedSearchIndex]) {
        handleResultClick(searchResults[selectedSearchIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSearchResults(false);
      setSelectedSearchIndex(-1);
    }
  };

  // Get icon for search result type
  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return BookOpen;
      case "student":
        return GraduationCap;
      case "assignment":
        return FileText;
      case "schedule":
        return Clock;
      case "notification":
        return Bell;
      case "page":
        return Search;
      default:
        return Search;
    }
  };

  const navItems = userType === "student" ? studentNavItems : professorNavItems;
  const searchPlaceholder =
    userType === "student"
      ? "Search courses, professors, exams..."
      : "Search courses, students, assignments...";
  const userTitle = userType === "student" ? "Student" : "Professor";
  const dashboardTitle =
    userType === "student" ? "Student Dashboard" : "Professor Dashboard";

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full bg-white/80 dark:bg-cardDark/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-sm px-4 sm:px-6 py-2.5 sm:py-3"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Section: Logo & Mobile Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isMobile && onMenuToggle && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMenuToggle}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </motion.button>
            )}

            <Link to={userType === 'student' ? '/student-dashboard' : '/professor-dashboard'} className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10">
                <img src={logo} alt="Smart Campus Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
              </div>
              <div className={`hidden sm:block ${isMobile ? 'hidden' : ''}`}>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                  Smart Campus
                </h1>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {dashboardTitle}
                </p>
              </div>
            </Link>
          </div>

          {/* Center Section: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <ul className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.hasSubmenu &&
                    item.submenu?.some(
                      (subItem) => location.pathname === subItem.path
                    ));
                const isSubmenuOpen = openSubmenu === item.path;

                return (
                  <li key={item.path} className="relative">
                    <div className="relative">
                      <div className={`flex items-center rounded-lg transition-all duration-200 ${isActive
                        ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                        }`}>
                        <button
                          onClick={() => navigate(item.path)}
                          onMouseEnter={() => createPreloadHandler(item.path)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${item.hasSubmenu ? 'rounded-l-lg' : 'rounded-lg'} hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.Tag}
                        </button>
                        {item.hasSubmenu && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubmenuToggle(item.path);
                            }}
                            className="px-2 py-2 rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-l border-gray-200/50 dark:border-gray-600/50"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Submenu */}
                      <AnimatePresence>
                        {item.hasSubmenu && isSubmenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden p-1"
                          >
                            {item.submenu?.map((subItem, idx) => {
                              const SubIcon = subItem.icon;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleSubmenuItemClick(subItem.path)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                                >
                                  <SubIcon className="w-4 h-4" />
                                  {subItem.Tag}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Section: Search & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Bar */}
            <div className="relative hidden md:block" ref={searchResultsRef}>
              <div className={`flex items-center transition-all duration-300 ${isSearching || searchQuery ? 'w-64' : 'w-48 focus-within:w-64'}`}>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100/50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {showSearchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
                  >
                    {/* Results Content (Same as before but styled) */}
                    {searchQuery.trim() ? (
                      <div className="p-2">
                        {searchResults.length > 0 ? (
                          searchResults.map((result, idx) => {
                            const Icon = getResultIcon(result.type);
                            return (
                              <button
                                key={idx}
                                onClick={() => handleResultClick(result)}
                                className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                              >
                                <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {result.title}
                                  </div>
                                  {result.description && (
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                      {result.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No results found
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Recent</div>
                        {recentSearches.map((search, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecentSearchClick(search)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left text-sm"
                          >
                            <History className="w-4 h-4 text-gray-400" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Search Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearchResults(!showSearchResults)}
              className={`md:hidden p-2 rounded-xl transition-colors ${showSearchResults
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1">
              <DarkModeToggle />
              <NotificationBell unreadCount={unreadCount} userType={userType} />
            </div>

            <div className="relative group ml-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleProfileClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogoutClick}
              className="hidden sm:flex p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        <AnimatePresence>
          {isMobile && showSearchResults && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-200 dark:border-gray-700 mt-2"
            >
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-100/50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mobile Search Results */}
                {searchQuery.trim() && (
                  <div className="mt-2 bg-white dark:bg-cardDark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((result, idx) => {
                        const Icon = getResultIcon(result.type);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0 text-left"
                          >
                            <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.title}
                              </div>
                              {result.description && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {result.description}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav >

      {/* Modals */}
      < ConfirmModal
        isOpen={showLogoutModal}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"

      />

      {showToast && (
        <Toast
          message="Logged out successfully"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )
      }
    </>
  );
}
