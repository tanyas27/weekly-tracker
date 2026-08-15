'use client';

import React, { useState } from 'react';
import { Bell, Leaf, Volume2, Sun, CheckCircle2, Ban, BellRing } from 'lucide-react';
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

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md backdrop-blur-2xl backdrop-saturate-150 shadow-2xl flex flex-col transition-all duration-300 ${
            isDark
              ? 'bg-black/40 border-l border-white/10 text-gray-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]'
              : 'bg-white/30 border-l border-white/50 text-gray-800 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]'
          }`}
        >
          {/* Drawer Header */}
          <div
            className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-gray-800'}`} />
              <h3
                className={`text-xl font-bold tracking-tight ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-full border backdrop-blur-md transition-all shadow-xs ${
                    isDark
                      ? 'bg-sky-400/20 border-sky-400/35 text-sky-300'
                      : 'bg-sky-500/15 border-sky-400/35 text-sky-900'
                  }`}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? 'hover:bg-white/15 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            className={`flex border-b px-5 pt-3 gap-4 ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}
          >
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'history'
                  ? isDark
                    ? 'border-blue-400 text-blue-300 font-bold'
                    : 'border-gray-900 text-gray-900 font-bold'
                  : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-200'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'settings'
                  ? isDark
                    ? 'border-blue-400 text-blue-300 font-bold'
                    : 'border-gray-900 text-gray-900 font-bold'
                  : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-200'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Preferences
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'history' ? (
              <>
                {/* Actions bar */}
                {notifications.length > 0 && (
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? 'border-white/10' : 'border-white/30'
                    }`}
                  >
                    <button
                      onClick={onMarkAllAsRead}
                      className={`text-xs font-semibold hover:underline ${
                        isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={onClearAll}
                      className={`text-xs font-semibold hover:underline ${
                        isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Clear history
                    </button>
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Leaf
                      className={`w-10 h-10 mx-auto mb-2 ${
                        isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'
                      }`}
                    />
                    <p
                      className={`text-lg font-semibold tracking-tight ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      No notifications yet!
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Relax and enjoy your scheduled week.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && onMarkAsRead(notif.id)}
                        className={`p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 relative overflow-hidden ${
                          notif.read
                            ? isDark
                              ? 'bg-white/5 border-white/5 opacity-60 backdrop-blur-sm'
                              : 'bg-white/20 border-white/30 opacity-70 backdrop-blur-sm'
                            : isDark
                            ? 'bg-white/10 border-white/15 shadow-md cursor-pointer hover:bg-white/15 hover:border-blue-400/60 hover:scale-[1.01]'
                            : 'bg-white/50 border-white/70 shadow-sm cursor-pointer hover:bg-white/70 hover:border-gray-400/80 hover:scale-[1.01]'
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-2 ${
                            notif.taskColor ||
                            (notif.type === 'completion'
                              ? 'bg-[#A5D6A7]'
                              : notif.type === 'summary'
                              ? 'bg-[#90CAF9]'
                              : 'bg-[#FFE082]')
                          }`}
                        />

                        <div className="pl-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-base font-bold tracking-tight ${
                                  isDark ? 'text-gray-100' : 'text-gray-900'
                                }`}
                              >
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Unread" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                {notif.timestamp}
                              </span>
                              {!notif.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notif.id);
                                  }}
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                    isDark
                                      ? 'bg-white/15 hover:bg-white/25 border-white/20 text-gray-100 shadow-sm'
                                      : 'bg-white/70 hover:bg-white/90 border-white/80 text-gray-800 shadow-sm'
                                  }`}
                                  title="Mark as read"
                                >
                                  ✓ Read
                                </button>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-xs mt-0.5 ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                          >
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Preferences Tab */
              <div className="space-y-5">
                <div
                  className={`p-4 rounded-xl border space-y-4 backdrop-blur-md shadow-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-gray-100'
                      : 'bg-white/30 border-white/50 text-gray-900'
                  }`}
                >
                  <h4
                    className={`font-semibold text-sm ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    System Alert Controls
                  </h4>

                  {/* Enable Notifications Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Enable Notifications
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Master switch for all alerts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                      className="w-4 h-4 accent-gray-900 dark:accent-blue-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Sound Effects Toggle */}
                  <div
                    className={`flex items-center justify-between pt-2.5 border-t ${
                      isDark ? 'border-white/10' : 'border-white/30'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Ghibli Sound Chimes{' '}
                        <Volume2 className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Play procedural audio chimes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                      className="w-4 h-4 accent-gray-900 dark:accent-blue-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Daily Summary Toggle */}
                  <div
                    className={`flex items-center justify-between pt-2.5 border-t ${
                      isDark ? 'border-white/10' : 'border-white/30'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Daily Morning Summary{' '}
                        <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Overview of today&apos;s schedule
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dailySummaryEnabled}
                      onChange={(e) => onUpdateSettings({ dailySummaryEnabled: e.target.checked })}
                      className="w-4 h-4 accent-gray-900 dark:accent-blue-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-3 backdrop-blur-md shadow-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-gray-100'
                      : 'bg-white/30 border-white/50 text-gray-900'
                  }`}
                >
                  <h4
                    className={`font-semibold text-sm ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    Default Reminder Timing
                  </h4>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Default lead time to send alerts prior to scheduled task start times:
                  </p>

                  <select
                    value={settings.defaultLeadTime}
                    onChange={(e) =>
                      onUpdateSettings({
                        defaultLeadTime: Number(e.target.value) as ReminderLeadTime,
                      })
                    }
                    className={`w-full text-xs p-2.5 rounded-lg border backdrop-blur-md outline-none transition-all focus:ring-2 ${
                      isDark
                        ? 'border-white/15 bg-black/40 text-gray-200 focus:ring-blue-400'
                        : 'border-white/60 bg-white/40 text-gray-800 focus:ring-gray-900'
                    }`}
                  >
                    <option value={0}>At task start time (0 min)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before (Default)</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                  </select>
                </div>                  {/* Native Browser Notification Permission */}
                <div
                  className={`p-4 rounded-xl border space-y-3 backdrop-blur-md shadow-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-gray-100'
                      : 'bg-white/30 border-white/50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-semibold text-sm ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      Background Web Push Alerts
                    </h4>
                    {isPushSubscribed && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        Push Active
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive system alerts even when the app or PWA is in the background or closed.
                  </p>

                  {permissionStatus === 'granted' ? (
                    <div
                      className={`space-y-3 pt-1 border-t ${
                        isDark ? 'border-white/10' : 'border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-semibold ${
                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
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
                          className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                            isDark
                              ? 'bg-zinc-800 border-white/15 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50'
                              : 'bg-emerald-50/80 border-emerald-200 text-[#2D5F3E] hover:bg-emerald-100 disabled:opacity-50'
                          }`}
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
                    <div
                      className={`p-3 rounded-xl border backdrop-blur-md text-xs font-medium space-y-1 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-300'
                          : 'bg-white/30 border-white/40 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Ban className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} /> Blocked in Browser
                        Settings
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Permissions were denied in browser. Please open site permissions in your browser address bar
                        to allow notifications.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={onRequestNativePermission}
                      className={`w-full py-2.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      <BellRing className="w-4 h-4" /> Enable Background Notifications
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
