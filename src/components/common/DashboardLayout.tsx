import { ReactNode, useState } from 'react';
import UnifiedNavbar from './UnifiedNavbar';
import MobileDrawer from '../MobileDrawer';
import SkipToContent from '../SkipToContent';
import { useResponsive } from '../../utils/responsive';

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string;
  userAvatar?: string;
  userType?: 'student' | 'professor';
}

export default function DashboardLayout({
  children,
  userName = 'Ahmed Hassan',
  userAvatar,
  userType = 'student'
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useResponsive();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <SkipToContent targetId="main-content" />
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-darkBg" role="application">
        <div className="flex-1 flex flex-col">
          <UnifiedNavbar
            userName={userName}
            userAvatar={userAvatar}
            userType={userType}
            onMenuToggle={isMobile ? handleMobileMenuToggle : undefined}
            isMenuOpen={isMobile ? isMobileMenuOpen : false}
          />

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200" tabIndex={-1}>
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            isOpen={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
            userType={userType}
          />
        )}
      </div>
    </>
  );
}

