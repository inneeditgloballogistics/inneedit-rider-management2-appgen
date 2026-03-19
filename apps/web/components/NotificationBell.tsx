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
    
    // Fetch immediately on mount with a small delay to ensure localStorage is ready
    const initialFetchTimer = setTimeout(() => {
      fetchNotifications();
    }, 100);
    
    // Poll for new notifications every 10 seconds (instead of 30)
    const interval = setInterval(fetchNotifications, 10000);
    
    // Refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing notifications...');
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(initialFetchTimer);
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
      
      // First check for hub manager (highest priority - used in hub-manager-dashboard)
      const hubManager = localStorage.getItem('hubManager');
      if (hubManager) {
        try {
          const manager = JSON.parse(hubManager);
          console.log('Hub Manager found:', { id: manager.id, name: manager.name });
          if (manager && manager.id) {
            queryParams = `?hubManagerId=${manager.id}`;
            debugInfo.source = 'hub_manager';
            debugInfo.id = manager.id;
          }
        } catch (e) {
          console.error('Error parsing hub manager:', e);
        }
      }
      
      // If no hub manager, check for rider (secondary - used in rider-dashboard)
      if (!queryParams) {
        const riderSession = localStorage.getItem('riderSession');
        if (riderSession) {
          try {
            const riderData = JSON.parse(riderSession);
            console.log('Rider session found:', { id: riderData.id, name: riderData.name });
            if (riderData && riderData.id) {
              queryParams = `?riderId=${riderData.id}`;
              debugInfo.source = 'rider';
              debugInfo.id = riderData.id;
            }
          } catch (e) {
            console.error('Error parsing rider session:', e);
          }
        }
      }
      
      // Only fetch if we have valid query params (hub manager or rider is logged in)
      if (!queryParams) {
        console.log('No hub manager or rider logged in, skipping notification fetch');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      console.log('Fetching notifications with params:', { queryParams, debugInfo });
      const response = await fetch(`/api/notifications${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications fetched:', { count: data.notifications?.length, unreadCount: data.unreadCount });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Notification fetch failed:', response.status);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
    
    // Route based on notification type
    if (notification.type === 'service_ticket_raised' || 
        notification.type === 'ticket_assigned_to_technician') {
      // Redirect to support tickets tab in hub manager dashboard
      // First close the modal
      setShowModal(false);
      // Then redirect with proper URL
      setTimeout(() => {
        window.location.href = '/hub-manager-dashboard?tab=tickets';
      }, 100);
    } else if (notification.type === 'swap_request_pending') {
      // Redirect to swap requests
      setShowModal(false);
      setTimeout(() => {
        window.location.href = '/hub-manager-dashboard?tab=swaps';
      }, 100);
    } else if (notification.type === 'swap_approved') {
      // Rider notification - redirect to rider dashboard
      setShowModal(false);
      setTimeout(() => {
        window.location.href = '/rider-dashboard';
      }, 100);
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
          setShowModal(!showModal);
          if (!showModal) fetchNotifications();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={20} className="text-slate-600" />
              </button>
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
