"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { HiBars3BottomRight, HiBell } from "react-icons/hi2";
import { HiOutlineViewGrid, HiOutlineShoppingCart, HiOutlineUser, HiOutlineHome } from "react-icons/hi";
import { FiPlus } from "react-icons/fi";
import SearchPop from "@/app/components/buyer/assets/search-pop";

type Props = {
  openNav: () => void;
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
  roleContext?: string;
}

function AppBar({ openNav }: Props) {
  const session: any = useSession();
  const userId = session?.data?.user?.id;
  
  // Get selected role from session or localStorage
  const [currentRole, setCurrentRole] = useState<string>("");
  const [currentUserRoleId, setCurrentUserRoleId] = useState<string>("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize current role
  useEffect(() => {
    if (session?.data?.user) {
      const selectedRole = session.data.user.selectedRole;
      const selectedUserRoleId = session.data.user.selectedUserRoleId;
      
      if (selectedRole && selectedUserRoleId) {
        setCurrentRole(selectedRole);
        setCurrentUserRoleId(selectedUserRoleId);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedRole', selectedRole);
          localStorage.setItem('selectedUserRoleId', selectedUserRoleId);
        }
      } else if (typeof window !== 'undefined') {
        // Try to get from localStorage
        const storedRole = localStorage.getItem('selectedRole');
        const storedUserRoleId = localStorage.getItem('selectedUserRoleId');
        
        if (storedRole && storedUserRoleId) {
          setCurrentRole(storedRole);
          setCurrentUserRoleId(storedUserRoleId);
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

  // Wrap fetchNotifications in useCallback
  const fetchNotifications = useCallback(async () => {
    if (!userId || !currentRole) return;
    
    try {
      // Pass current role to API to filter notifications
      const response = await fetch(`/api/notifications/${userId}?role=${currentRole}`);
      if (response.ok) {
        const data = await response.json();
        // Notifications are already filtered by role on the backend
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [userId, currentRole]);

  // Fetch notifications for current role ONLY
  useEffect(() => {
    if (userId && currentRole) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, currentRole, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationId,
        }),
      });

      if (response.ok) {
        // Refresh notifications after marking as read
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAllAsRead',
          role: currentRole, // Pass current role to only mark notifications for this role
        }),
      });

      if (response.ok) {
        // Refresh notifications after marking all as read
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ASSET_CREATED':
        return '📄';
      case 'BID_RECEIVED':
        return '💰';
      case 'BID_ACCEPTED':
        return '✅';
      case 'BID_REJECTED':
        return '❌';
      case 'BID_SAVED':
        return '💾';
      case 'PAYMENT_MADE':
        return '💳';
      case 'FEE_APPROVED':
        return '✔️';
      case 'BILL_TO_PARTY_VALIDATED':
        return '🔍';
      case 'ASSET_POSTED':
        return '🚀';
      case 'ASSET_CANCELLED':
        return '🚫';
      default:
        return '📢';
    }
  };

  // Get role-specific paths
  const getDashboardPath = () => {
    if (!currentRole || !userId) return "/";
    return currentRole === "seller" ? `/sellers/${userId}` : `/buyers/${userId}`;
  };

  const getLiqwickPath = () => {
    if (!currentRole || !userId) return "/";
    return currentRole === "seller" 
      ? `/sellers/${userId}/liqwick` 
      : `/buyers/${userId}/liqwick`;
  };

  const getMarketplacePath = () => {
    if (!currentRole || !userId) return "/";
    return currentRole === "seller"
      ? `/sellers/${userId}/marketplace`
      : `/buyers/${userId}/marketplace`;
  };
  
  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full navbar bg-pink-700 text-white z-50">
        <div className="flex items-center h-full justify-between w-[90%] xl:w-[80%] mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {session?.status === "authenticated" && (
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-700">
                <span className="text-xs capitalize">{session?.data?.user?.username[0]}</span>
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Liqwik</h1>
              {currentRole && (
                <p className="text-xs text-pink-200 capitalize">({currentRole})</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell - Shows only notifications for current role */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-7 h-7 cursor-pointer"
              >
                <HiBell className="w-7 h-7" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-800 max-h-96 overflow-y-auto z-50">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Notifications</h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {currentRole} notifications
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-pink-700 hover:text-pink-800"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet for {currentRole} role
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 text-center border-t border-gray-200">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-sm text-pink-700 hover:text-pink-800"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <HiBars3BottomRight onClick={openNav} className="w-7 h-7 cursor-pointer text-white" />
          </div>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-around items-center border-t z-50">
        {/* Dashboard */}
        <Link href={getDashboardPath()}>
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineViewGrid size={24} />
            <span className="text-xs">Dashboard</span>
          </button>
        </Link>

        {/* My Liqwick */}
        <Link href={getLiqwickPath()}>
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineHome size={24} />
            <span className="text-xs">My Liqwik</span>
          </button>
        </Link>

        {/* Floating Add Button */}
        {currentRole === "buyer" && (
          <button onClick={() => setShowFilters(true)} className="flex flex-col items-center text-gray-500 hover:text-pink-700">
            <div className="w-10 h-10 border-[10px] border-pink-700 rounded-full"></div>
          </button>
        )}
        {currentRole === "seller" && (
          <Link href={`/sellers/${userId}/assets/new`}>
            <button className="flex flex-col items-center text-gray-500 hover:text-pink-700">
              <div className="w-10 h-10 border-[10px] border-pink-700 rounded-full"></div>
            </button>
          </Link>
        )}

        {/* Marketplace */}
        <Link href={getMarketplacePath()}>
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineShoppingCart size={24} />
            <span className="text-xs">Marketplace</span>
          </button>
        </Link>

        {/* Profile */}
        <Link href={getDashboardPath()}>
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineUser size={24} />
            <span className="text-xs">Profile</span>
          </button>
        </Link>
      </div>
      {showFilters && <SearchPop setShowFilters={setShowFilters} />}
    </>
  );
}

export default AppBar;