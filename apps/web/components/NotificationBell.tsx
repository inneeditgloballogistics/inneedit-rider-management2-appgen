'use client';

import { useState, useEffect } from 'react';
import { Bell, X, MoreVertical, RefreshCw } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    console.log('NotificationBell component mounted');
    // Initial fetch immediately
    fetchNotifications();
    // Fetch notifications every 2 seconds (even more frequent)
    const interval = setInterval(() => {
      console.log('[NotificationBell] Auto-fetching notifications...');
      fetchNotifications();
    }, 2000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[NotificationBell] Tab became visible, refreshing notifications...');
        fetchNotifications();
      }
    };
    const handleFocus = () => {
      console.log('[NotificationBell] Window focused, fetching notifications...');
      fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let queryParams = '';
      let debugInfo: any = { source: 'none' };
      
      // ✅ HYBRID APPROACH: Check rider first (client-side riders are NOT in AppGen auth)
      const riderSession = localStorage.getItem('riderSession');
      if (riderSession) {
        try {
          const riderData = JSON.parse(riderSession);
          console.log('🔵 [NotificationBell] Rider session found:', { id: riderData.id });
          if (riderData && riderData.id) {
            queryParams = `?riderId=${riderData.id}`;
            debugInfo.source = 'rider';
            debugInfo.id = riderData.id;
            console.log('🟢 [NotificationBell] Rider ID found:', riderData.id);
          }
        } catch (e) {
          console.error('🔴 [NotificationBell] Error parsing rider session:', e);
        }
      }
      
      // Check technician
      if (!queryParams) {
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
      }
      
      // Check hub manager LAST
      if (!queryParams) {
        const hubManager = localStorage.getItem('hubManager');
        if (hubManager) {
          try {
            const manager = JSON.parse(hubManager);
            console.log('🔵 [NotificationBell] Hub Manager parsed:', { id: manager.id, hubId: manager.hubId, fullObject: JSON.stringify(manager) });
            if (manager && manager.id) {
              const managerId = String(manager.id).trim();
              queryParams = `?hubManagerId=${managerId}`;
              debugInfo.source = 'hub_manager';
              debugInfo.id = managerId;
              debugInfo.numeric_id = manager.id;
              console.log('🟢 [NotificationBell] Hub Manager ID found:', { stringId: managerId, numericId: manager.id });
            } else {
              console.error('🔴 [NotificationBell] Manager object exists but has no id:', manager);
            }
          } catch (e) {
            console.error('🔴 [NotificationBell] Error parsing hub manager:', e);
          }
        } else {
          console.log('🟡 [NotificationBell] No hubManager in localStorage');
        }
      }
      
      if (!queryParams) {
        console.log('🟠 [NotificationBell] No user logged in, skipping fetch');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      console.log('🟢 [NotificationBell] Fetching notifications with params:', queryParams, debugInfo);
      const response = await fetch(`/api/notifications${queryParams}`);
      
      if (!response.ok) {
        console.error('🔴 [NotificationBell] Fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('🔴 [NotificationBell] Error response:', errorText);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      const data = await response.json();
      console.log('🟢 [NotificationBell] Got', data.notifications?.length || 0, 'notifications, unread:', data.unreadCount || 0);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('🔴 [NotificationBell] Error:', error);
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
    const icons: Record<string, { emoji: string; bgColor: string; label: string }> = {
      'new_rider_onboarding': { emoji: '👤', bgColor: 'bg-cyan-100', label: 'ONBOARDING' },
      'rider_assignment': { emoji: '🚗', bgColor: 'bg-blue-100', label: 'ASSIGNMENT' },
      'vehicle_handover_complete': { emoji: '✅', bgColor: 'bg-green-100', label: 'HANDOVER' },
      'vehicle_handover_admin': { emoji: '✓', bgColor: 'bg-green-100', label: 'HANDOVER' },
      'new_rider_registered': { emoji: '👤', bgColor: 'bg-cyan-100', label: 'NEW RIDER' },
      'referral': { emoji: '🎁', bgColor: 'bg-purple-100', label: 'REFERRAL' },
      'referral_approved': { emoji: '✅', bgColor: 'bg-green-100', label: 'REFERRAL APPROVED' },
      'bank_update': { emoji: '🏦', bgColor: 'bg-indigo-100', label: 'BANK UPDATE' },
      'service_ticket_raised': { emoji: '🔧', bgColor: 'bg-orange-100', label: 'SERVICE TICKET' },
      'ticket_assigned_to_technician': { emoji: '🔨', bgColor: 'bg-amber-100', label: 'TICKET ASSIGNED' },
      'ticket_resolved': { emoji: '✨', bgColor: 'bg-yellow-100', label: 'TICKET RESOLVED' },
      'swap_request_pending': { emoji: '🔄', bgColor: 'bg-cyan-100', label: 'SWAP REQUEST' },
      'swap_approved': { emoji: '✅', bgColor: 'bg-green-100', label: 'SWAP APPROVED' },
      'swap_completed': { emoji: '🎉', bgColor: 'bg-pink-100', label: 'SWAP COMPLETED' },
      'vehicle_swap': { emoji: '🚙', bgColor: 'bg-blue-100', label: 'VEHICLE SWAP' },
    };
    return icons[type] || { emoji: '📢', bgColor: 'bg-gray-100', label: 'NOTIFICATION' };
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Use the notification's recipient_type to determine where to redirect
    // This ensures the correct user sees the correct page
    if (notification.recipient_type === 'hub_manager') {
      if (notification.type === 'service_ticket_raised' || notification.type === 'new_rider_onboarding') {
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
    } else if (notification.recipient_type === 'technician') {
      if (notification.type === 'ticket_assigned_to_technician' || notification.type === 'swap_approved') {
        setShowModal(false);
        setTimeout(() => {
          window.location.href = '/technician-dashboard?tab=tickets';
        }, 100);
      }
    } else if (notification.recipient_type === 'rider') {
      if (notification.type === 'swap_approved' || notification.type === 'vehicle_handover_complete' || notification.type === 'ticket_resolved') {
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
      <button
        onClick={() => {
          const newModalState = !showModal;
          setShowModal(newModalState);
          if (newModalState) {
            fetchNotifications();
          }
        }}
        className="relative inline-flex items-center justify-center h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
        title="Notifications"
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-end p-4 pt-16">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:w-[420px] max-h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Notifications</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('[NotificationBell] Manual refresh clicked');
                    fetchNotifications();
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-600 hover:text-slate-900"
                  title="Refresh notifications"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={24} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 flex gap-6 sticky top-16 bg-white z-10">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 font-medium text-sm relative transition-colors ${
                  activeTab === 'all'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For You
                {activeTab === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`py-3 font-medium text-sm relative transition-colors ${
                  activeTab === 'unread'
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unread
                {unreadCount > 0 && activeTab === 'unread' && (
                  <span className="ml-2 inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
                {activeTab === 'unread' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Loading notifications...</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const filtered = activeTab === 'unread'
                      ? notifications.filter((n: any) => !n.is_read)
                      : notifications;

                    return filtered.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <Bell size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">
                          {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4">
                        {filtered.map((notification: any) => {
                          const iconData = getNotificationIcon(notification.type);
                          return (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                notification.is_read
                                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Icon Circle */}
                                <div className={`flex-shrink-0 w-14 h-14 rounded-full ${iconData.bgColor} flex items-center justify-center text-2xl`}>
                                  {iconData.emoji}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Label Badge */}
                                  <div className="mb-2">
                                    <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full tracking-wide">
                                      {iconData.label}
                                    </span>
                                  </div>

                                  {/* Title */}
                                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                    {notification.title}
                                  </h4>

                                  {/* Message */}
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                                    {notification.message}
                                  </p>

                                  {/* Timestamp */}
                                  <p className="text-xs text-slate-500 mt-2">
                                    {new Date(notification.created_at).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: 'Asia/Kolkata'
                                    })}
                                  </p>
                                </div>

                                {/* More Menu */}
                                <div className="flex-shrink-0 text-slate-400 hover:text-slate-600">
                                  <MoreVertical size={18} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Footer Action */}
            {notifications.length > 0 && unreadCount > 0 && activeTab === 'all' && (
              <div className="p-4 border-t border-slate-200 sticky bottom-0 bg-white">
                <button
                  onClick={markAllAsRead}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg text-sm font-bold hover:from-cyan-500 hover:to-cyan-600 transition-all shadow-sm"
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
