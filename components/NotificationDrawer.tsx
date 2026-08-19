'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Leaf, Volume2, Sun, CheckCircle2, Ban, BellRing, X } from 'lucide-react';
import { AppNotification, NotificationSettings, ReminderLeadTime } from '@/types/notification';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  settings: NotificationSettings;
  permissionStatus: NotificationPermission | 'unsupported';
  isDark: boolean;
  isPushSubscribed?: boolean;
  isSendingTest?: boolean;
  onUpdateSettings: (newSettings: Partial<NotificationSettings>) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onRequestNativePermission: () => void;
  onSendTestNotification?: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  settings,
  permissionStatus,
  isDark,
  isPushSubscribed = false,
  isSendingTest = false,
  onUpdateSettings,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onRequestNativePermission,
  onSendTestNotification,
}: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`
          fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/*
        ── Outer positioner ──
        MOBILE  : top sheet — slides down from below the nav
        DESKTOP : right panel — slides left/right (translateX)
      */}
      <div
        className={`
          fixed z-[130] transition-transform duration-300 ease-in-out

          /* Mobile: top sheet — starts at very top, slides over nav */
          top-0 left-0 right-0
          ${isOpen ? 'translate-y-0' : '-translate-y-full'}

          /* Desktop: right panel — starts below nav */
          md:top-14 md:bottom-0 md:left-auto md:right-0 md:h-[calc(100vh-3.5rem)]
          ${isOpen ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-full md:translate-y-0'}
        `}
      >
        {/*
          ── Inner panel ──
          MOBILE  : full-width, capped height, rounded top corners
          DESKTOP : fixed width, full height, square
        */}
        <div
          className={`
            flex flex-col backdrop-blur-2xl backdrop-saturate-150 shadow-2xl

            /* Mobile sizing — top sheet */
            w-full max-h-[80vh] rounded-b-2xl

            /* Desktop sizing */
            md:w-[26rem] md:max-h-none md:h-full md:rounded-none

            ${isDark
              ? 'bg-black/60 border-b border-[#2a3a4a]/60 md:border-b-0 md:border-l text-gray-100 shadow-[0_8px_40px_0_rgba(0,0,0,0.7)]'
              : 'bg-white/70 border-b border-white/60 md:border-b-0 md:border-l text-gray-800 shadow-[0_8px_40px_0_rgba(0,0,0,0.15)]'
            }
          `}
        >

          {/* ── Header ── */}
          <div
            className={`
              p-5 border-b flex items-center justify-between flex-shrink-0
              ${isDark ? 'border-white/10' : 'border-white/40'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
              <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold
                    rounded-full border backdrop-blur-md shadow-xs
                    ${isDark
                      ? 'bg-sky-400/20 border-sky-400/35 text-sky-300'
                      : 'bg-sky-500/15 border-sky-400/35 text-sky-900'
                    }
                  `}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200 border border-white/10'
                  : 'hover:bg-black/5 text-gray-500 hover:text-gray-800 border border-black/10'
                }
              `}
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Navigation Tabs ── */}
          <div
            className={`
              flex border-b px-5 pt-2 gap-5 flex-shrink-0
              ${isDark ? 'border-white/10' : 'border-white/40'}
            `}
          >
            {(['history', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  pb-2.5 text-sm font-semibold border-b-2 transition-all capitalize
                  ${activeTab === tab
                    ? isDark
                      ? 'border-blue-400 text-blue-300 font-bold'
                      : 'border-gray-900 text-gray-900 font-bold'
                    : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                  }
                `}
              >
                {tab === 'history' ? `History (${notifications.length})` : 'Preferences'}
              </button>
            ))}
          </div>

          {/* ── Body (scrollable) ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {activeTab === 'history' ? (
              <>
                {/* Actions bar */}
                {notifications.length > 0 && (
                  <div
                    className={`
                      flex items-center justify-between pb-2 border-b
                      ${isDark ? 'border-white/10' : 'border-white/40'}
                    `}
                  >
                    <button
                      onClick={onMarkAllAsRead}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={onClearAll}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Clear history
                    </button>
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Leaf className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`} />
                    <p className={`text-lg font-semibold tracking-tight ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      No notifications yet!
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Relax and enjoy your scheduled week.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && onMarkAsRead(notif.id)}
                        className={`
                          p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 relative overflow-hidden
                          ${notif.read
                            ? isDark
                              ? 'bg-white/5 border-white/5 opacity-60'
                              : 'bg-white/20 border-white/30 opacity-70'
                            : isDark
                            ? 'bg-white/10 border-white/15 shadow-md cursor-pointer hover:bg-white/15 hover:border-blue-400/60 hover:scale-[1.01]'
                            : 'bg-white/50 border-white/70 shadow-sm cursor-pointer hover:bg-white/70 hover:border-gray-400/80 hover:scale-[1.01]'
                          }
                        `}
                      >
                        {/* Colour accent bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                            notif.taskColor ||
                            (notif.type === 'completion'
                              ? 'bg-[#A5D6A7]'
                              : notif.type === 'summary'
                              ? 'bg-[#90CAF9]'
                              : 'bg-[#FFE082]')
                          }`}
                        />
                        <div className="pl-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Unread" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {notif.timestamp}
                              </span>
                              {!notif.read && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onMarkAsRead(notif.id); }}
                                  className={`
                                    text-xs font-semibold px-2 py-0.5 rounded-lg border transition-all
                                    ${isDark
                                      ? 'bg-white/15 hover:bg-white/25 border-white/20 text-gray-100'
                                      : 'bg-white/70 hover:bg-white/90 border-white/80 text-gray-800'
                                    }
                                  `}
                                  title="Mark as read"
                                >
                                  ✓ Read
                                </button>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ── Preferences Tab ── */
              <div className="space-y-4">
                {/* System Alert Controls */}
                <div
                  className={`
                    p-4 rounded-xl border space-y-4 backdrop-blur-md shadow-sm
                    ${isDark ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-white/40 border-white/50 text-gray-900'}
                  `}
                >
                  <h4 className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    System Alert Controls
                  </h4>

                  {[
                    {
                      label: 'Enable Notifications',
                      description: 'Master switch for all alerts',
                      key: 'enabled' as keyof NotificationSettings,
                      value: settings.enabled,
                      icon: null,
                    },
                    {
                      label: 'Ghibli Sound Chimes',
                      description: 'Play procedural audio chimes',
                      key: 'soundEnabled' as keyof NotificationSettings,
                      value: settings.soundEnabled,
                      icon: <Volume2 className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />,
                    },
                    {
                      label: 'Daily Morning Summary',
                      description: "Overview of today's schedule",
                      key: 'dailySummaryEnabled' as keyof NotificationSettings,
                      value: settings.dailySummaryEnabled,
                      icon: <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />,
                    },
                  ].map((item, i) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between ${i > 0 ? `pt-3 border-t ${isDark ? 'border-white/10' : 'border-white/30'}` : ''}`}
                    >
                      <div>
                        <p className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.label} {item.icon}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.value as boolean}
                        onChange={(e) => onUpdateSettings({ [item.key]: e.target.checked })}
                        className="w-4 h-4 accent-gray-900 dark:accent-blue-500 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Reminder Timing */}
                <div
                  className={`
                    p-4 rounded-xl border space-y-3 backdrop-blur-md shadow-sm
                    ${isDark ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-white/40 border-white/50 text-gray-900'}
                  `}
                >
                  <h4 className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Default Reminder Timing
                  </h4>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Lead time to send alerts before a task starts:
                  </p>
                  <select
                    value={settings.defaultLeadTime}
                    onChange={(e) => onUpdateSettings({ defaultLeadTime: Number(e.target.value) as ReminderLeadTime })}
                    className={`
                      w-full text-xs p-2.5 rounded-lg border backdrop-blur-md outline-none transition-all focus:ring-2
                      ${isDark
                        ? 'border-white/15 bg-black/40 text-gray-200 focus:ring-blue-400'
                        : 'border-white/60 bg-white/40 text-gray-800 focus:ring-gray-900'
                      }
                    `}
                  >
                    <option value={0}>At task start time (0 min)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before (Default)</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                  </select>
                </div>

                {/* Web Push */}
                <div
                  className={`
                    p-4 rounded-xl border space-y-3 backdrop-blur-md shadow-sm
                    ${isDark ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-white/40 border-white/50 text-gray-900'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Background Web Push Alerts
                    </h4>
                    {isPushSubscribed && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        Push Active
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive system alerts even when the app is in the background or closed.
                  </p>

                  {permissionStatus === 'granted' ? (
                    <div className={`space-y-3 pt-1 border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <CheckCircle2 className="w-4 h-4" /> System Permission Granted
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.nativeNotificationsEnabled}
                          onChange={(e) => onUpdateSettings({ nativeNotificationsEnabled: e.target.checked })}
                          className="w-4 h-4 accent-gray-900 dark:accent-blue-500 rounded cursor-pointer"
                        />
                      </div>
                      {onSendTestNotification && (
                        <button
                          type="button"
                          onClick={onSendTestNotification}
                          disabled={isSendingTest}
                          className={`
                            w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-all
                            flex items-center justify-center gap-1.5 shadow-xs cursor-pointer
                            ${isDark
                              ? 'bg-zinc-800 border-white/15 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50'
                              : 'bg-emerald-50/80 border-emerald-200 text-[#2D5F3E] hover:bg-emerald-100 disabled:opacity-50'
                            }
                          `}
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          {isSendingTest ? 'Sending Test Alert...' : 'Send Test Background Alert'}
                        </button>
                      )}
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isPushSubscribed
                          ? 'Device registered with push service. Reminders will arrive in the background.'
                          : 'Push service registering. Tap test button above to verify delivery.'}
                      </p>
                    </div>
                  ) : permissionStatus === 'denied' ? (
                    <div className={`p-3 rounded-xl border backdrop-blur-md text-xs font-medium space-y-1 ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white/30 border-white/40 text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Ban className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} /> Blocked in Browser Settings
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Permissions were denied. Open site permissions in your browser address bar to allow notifications.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={onRequestNativePermission}
                      className={`
                        w-full py-2.5 px-3 text-xs font-semibold rounded-lg transition-all
                        flex items-center justify-center gap-2 shadow-sm
                        ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}
                      `}
                    >
                      <BellRing className="w-4 h-4" /> Enable Background Notifications
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* ── Mobile drag handle pill at bottom of top-sheet ── */}
          <div className="flex justify-center pb-3 pt-1 md:hidden flex-shrink-0">
            <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />
          </div>
        </div>
      </div>
    </>
  );
}
