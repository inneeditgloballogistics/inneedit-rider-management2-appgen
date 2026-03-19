'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('NotificationBell component mounted');
    
    // Fetch immediately on mount
    fetchNotifications();
    
    // Poll for new notifications every 5 seconds (more frequent)
    const interval = setInterval(fetchNotifications, 5000);
    
    // Refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing notifications...');
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Check if there's a logged-in user/role to fetch role-specific notifications
      let queryParams = '';
      let debugInfo: any = { source: 'none' };
      
      // Check for technician first (highest priority - used in technician-dashboard)
      const technician = localStorage.getItem('technician');
      if (technician) {
        try {
          const tech = JSON.parse(technician);
          console.log('🔵 [NotificationBell] Technician found:', { id: tech.user_id, name: tech.name });
          if (tech && tech.user_id) {
            queryParams = `?technicianId=${tech.user_id}`;
            debugInfo.source = 'technician';
            debugInfo.id = tech.user_id;
          }
        } catch (e) {
          console.error('🔴 [NotificationBell] Error parsing technician:', e);
        }
      }
      
      // If no technician, check for hub manager (secondary - used in hub-manager-dashboard)
      if (!queryParams) {
        const hubManager = localStorage.getItem('hubManager');
        console.log('🔵 [NotificationBell] Checking hubManager localStorage:', hubManager ? 'Found' : 'Not found');
        if (hubManager) {
          try {
            const manager = JSON.parse(hubManager);
            console.log('🔵 [NotificationBell] Hub Manager parsed successfully:', JSON.stringify(manager));
            if (manager && manager.id) {
              queryParams = `?hubManagerId=${manager.id}`;
              debugInfo.source = 'hub_manager';
              debugInfo.id = manager.id;
              console.log('🟢 [NotificationBell] Hub Manager ID found:', manager.id);
            } else {
              console.warn('🟠 [NotificationBell] Hub Manager has no ID field!', JSON.stringify(manager));
            }
          } catch (e) {
            console.error('🔴 [NotificationBell] Error parsing hub manager:', e);
          }
        } else {
          console.log('🟠 [NotificationBell] No hubManager in localStorage');
        }
      }
      
      // If no hub manager, check for rider (tertiary - used in rider-dashboard)
      if (!queryParams) {
        const riderSession = localStorage.getItem('riderSession');
        if (riderSession) {
          try {
            const riderData = JSON.parse(riderSession);
            console.log('🔵 [NotificationBell] Rider session found:', { id: riderData.id, name: riderData.name });
            if (riderData && riderData.id) {
              queryParams = `?riderId=${riderData.id}`;
              debugInfo.source = 'rider';
              debugInfo.id = riderData.id;
            }
          } catch (e) {
            console.error('🔴 [NotificationBell] Error parsing rider session:', e);
          }
        }
      }
      
      // Only fetch if we have valid query params (technician, hub manager, or rider is logged in)
      if (!queryParams) {
        console.log('🟠 [NotificationBell] No technician, hub manager, or rider logged in, skipping notification fetch');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      console.log('🟢 [NotificationBell] Fetching notifications with params:', queryParams, debugInfo);
      const response = await fetch(`/api/notifications${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🟢 [NotificationBell] Notifications response:', { count: data.notifications?.length, unreadCount: data.unreadCount, queryParams });
        console.log('🔵 [NotificationBell] Full notifications data:', JSON.stringify(data.notifications));
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('🔴 [NotificationBell] Notification fetch failed with status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🔴 [NotificationBell] Error response:', errorText);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('🔴 [NotificationBell] Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, isRead: true })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_rider_onboarding':
        return '👤';
      case 'rider_assignment':
        return '🚗';
      case 'vehicle_handover_complete':
        return '✅';
      case 'vehicle_handover_admin':
        return '✓';
      case 'new_rider_registered':
        return '👤';
      case 'referral':
        return '🎁';
      case 'referral_approved':
        return '✅';
      case 'bank_update':
        return '🏦';
      case 'service_ticket_raised':
        return '🔧';
      case 'ticket_assigned_to_technician':
        return '🔨';
      case 'ticket_resolved':
        return '✨';
      case 'swap_request_pending':
        return '🔄';
      case 'swap_approved':
        return '✅';
      case 'swap_completed':
        return '🎉';
      case 'vehicle_swap':
        return '🚙';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Check user role and route accordingly
    const technician = localStorage.getItem('technician');
    const hubManager = localStorage.getItem('hubManager');
    const riderSession = localStorage.getItem('riderSession');
    
    // Route based on notification type and user role
    if (technician) {
      // Technician routes
      if (notification.type === 'ticket_assigned_to_technician') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/technician-dashboard?tab=tickets';
        }, 100);
      } else if (notification.type === 'swap_approved') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/technician-dashboard?tab=tickets';
        }, 100);
      }
    } else if (hubManager) {
      // Hub manager routes
      if (notification.type === 'service_ticket_raised' || 
          notification.type === 'new_rider_onboarding') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/hub-manager-dashboard?tab=tickets';
        }, 100);
      } else if (notification.type === 'swap_request_pending') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/hub-manager-dashboard?tab=swaps';
        }, 100);
      }
    } else if (riderSession) {
      // Rider routes
      if (notification.type === 'swap_approved') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/rider-dashboard';
        }, 100);
      }
    }
  };

  const getNotificationColor = (isRead: boolean) => {
    return isRead ? 'bg-slate-50' : 'bg-blue-50 border-l-4 border-l-blue-500';
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => {
          const newModalState = !showModal;
          setShowModal(newModalState);
          // Always fetch fresh notifications when opening modal
          if (newModalState) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
        title="Notifications"
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
                  title="Refresh"
                >
                  <svg className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${getNotificationColor(
                        notification.is_read
                      )} hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(notification.created_at).toLocaleDateString(
                              'en-IN',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Kolkata'
                              }
                            )}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-4 border-t border-slate-200 sticky bottom-0 bg-slate-50">
                <button
                  onClick={markAllAsRead}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
