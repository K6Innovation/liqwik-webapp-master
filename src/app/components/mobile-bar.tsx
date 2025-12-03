"use client";
import React, { useState, useEffect } from "react";
import { NavLinks } from "./NavLinks";
import Link from "next/link";
import { CgClose } from "react-icons/cg";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  showNav: boolean;
  closeNav: () => void;
};

interface UserRoleData {
  userRoleId: string;
  roleId: string;
  roleName: string;
}

const MobileBar = ({ closeNav, showNav }: Props) => {
  const navOpen = showNav ? "translate-x-0" : "translate-x-[-100%]";
  const session: any = useSession();
  const router = useRouter();
  const userId = session?.data?.user?.id || "";
  const userRoles = session?.data?.user?.userRoles || [];
  
  const [currentRole, setCurrentRole] = useState<string>("");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Get current role
  useEffect(() => {
    if (session?.data?.user) {
      const selectedRole = session.data.user.selectedRole;
      if (selectedRole) {
        setCurrentRole(selectedRole);
      } else if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('selectedRole');
        if (storedRole) {
          setCurrentRole(storedRole);
        } else {
          // Fallback to first role if available
          const roles = session.data.user.roles || [];
          if (roles.length > 0) {
            setCurrentRole(roles[0]);
          }
        }
      }
    }
  }, [session]);

  const handleRoleSwitch = async (roleData: UserRoleData) => {
    try {
      // Update session
      await session.update({
        selectedRole: roleData.roleName,
        selectedUserRoleId: roleData.userRoleId,
      });

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedRole', roleData.roleName);
        localStorage.setItem('selectedUserRoleId', roleData.userRoleId);
      }

      // Update current role state
      setCurrentRole(roleData.roleName);

      // Close menus
      setShowRoleSwitcher(false);
      closeNav();

      // Redirect to appropriate dashboard
      if (roleData.roleName === "buyer") {
        router.push(`/buyers/${userId}`);
      } else if (roleData.roleName === "seller") {
        router.push(`/sellers/${userId}`);
      } else if (roleData.roleName === "admin") {
        router.push(`/admin/${userId}`);
      }
      
      // Refresh the page to update all components
      router.refresh();
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  return (
    <div>
      {/* Overlay */}
      <div
        className={`fixed ${navOpen} inset-0 transform transition-all duration-500 z-[1002] bg-black opacity-70 w-full h-screen`}
      ></div>

      {/* Sidebar */}
      <div
        className={`text-black fixed ${navOpen} flex flex-col h-full transform transition-all duration-500 delay-300 w-[80%] sm:w-[60%] bg-white z-[1050] p-6 overflow-y-auto`}
      >
        {/* Logo + Tagline */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-pink-700">LIQWIK</h1>
          <p className="text-sm text-gray-500">Liquidity • Quickly</p>
          {currentRole && (
            <p className="text-xs text-pink-600 mt-1 capitalize">Current Role: {currentRole}</p>
          )}
        </div>

        {/* Divider Line */}
        <hr className="border-gray-300 my-3" />

        {/* Navigation Links */}
        <div className="flex flex-col gap-6 mt-4">
          {NavLinks.map((link) => {
            if (link.isSwitchRole) {
              // Only show if user has multiple roles
              if (userRoles.length <= 1) return null;
              
              return (
                <div key={link.id}>
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="flex items-center gap-3 text-lg font-medium text-gray-800 hover:text-pink-700 w-full"
                  >
                    {link.icon} {link.label}
                  </button>
                  
                  {/* Role Switcher Dropdown */}
                  {showRoleSwitcher && (
                    <div className="ml-8 mt-2 space-y-2">
                      {userRoles.map((roleData: UserRoleData) => (
                        <button
                          key={roleData.userRoleId}
                          onClick={() => handleRoleSwitch(roleData)}
                          className={`block w-full text-left px-3 py-2 rounded text-sm ${
                            currentRole === roleData.roleName
                              ? 'bg-pink-100 text-pink-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="capitalize">{roleData.roleName}</span>
                          {currentRole === roleData.roleName && (
                            <span className="ml-2 text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (link.isSignOut) {
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    closeNav();
                    // Clear localStorage on sign out
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('selectedRole');
                      localStorage.removeItem('selectedUserRoleId');
                    }
                    signOut();
                  }}
                  className="flex items-center gap-3 text-lg font-medium text-gray-800 hover:text-pink-700"
                >
                  {link.icon} {link.label}
                </button>
              );
            }

            const href =
              typeof link.href === "function"
                ? link.href(currentRole, userId)
                : link.href;

            return (
              <Link
                key={link.id}
                href={href || "#"}
                onClick={closeNav}
                className="flex items-center gap-3 text-lg font-medium text-gray-800 hover:text-pink-700"
              >
                {link.icon} {link.label}
              </Link>
            );
          })}
        </div>

        {/* Close Icon */}
        <CgClose
          onClick={closeNav}
          className="absolute top-4 right-4 text-gray-600 hover:text-black w-8 h-8 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default MobileBar;