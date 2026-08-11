import { useState, useCallback, useEffect } from 'react';

export function useCalendarPrivacy(calendarId: string) {
  const getStoredPasscode = useCallback(() => {
    if (typeof window === 'undefined' || !calendarId) return '';
    return localStorage.getItem(`calendar_passcode_${calendarId}`) || '';
  }, [calendarId]);

  const [passcodeHash, setPasscodeHash] = useState<string>(getStoredPasscode);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    queueMicrotask(() => {
      setPasscodeHash(getStoredPasscode());
    });
  }, [calendarId, getStoredPasscode]);

  const handleServerPrivacyState = useCallback((serverIsPrivate: boolean, serverIsLocked: boolean) => {
    setIsPrivate(serverIsPrivate);
    setIsLocked(serverIsLocked);
  }, []);

  const unlockCalendar = useCallback(
    async (passcode: string, onSuccess?: (passcode: string) => void) => {
      try {
        const res = await fetch(`/api/calendars/${calendarId}/privacy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', passcode }),
        });

        const data = await res.json();
        if (res.ok && data.verified) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`calendar_passcode_${calendarId}`, passcode);
          }
          setPasscodeHash(passcode);
          setIsLocked(false);
          if (onSuccess) onSuccess(passcode);
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Invalid passcode' };
        }
      } catch (err) {
        console.error('unlockCalendar error:', err);
        return { success: false, error: 'Network error. Please try again.' };
      }
    },
    [calendarId]
  );

  const lockCalendar = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`calendar_passcode_${calendarId}`);
    }
    setPasscodeHash('');
    setIsLocked(true);
  }, [calendarId]);

  const updatePrivacySettings = useCallback(
    async (targetIsPrivate: boolean, newPin?: string, currPin?: string) => {
      try {
        const res = await fetch(`/api/calendars/${calendarId}/privacy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            isPrivate: targetIsPrivate,
            newPasscode: newPin,
            currentPasscode: currPin || passcodeHash,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsPrivate(targetIsPrivate);
          if (targetIsPrivate && newPin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`calendar_passcode_${calendarId}`, newPin);
            }
            setPasscodeHash(newPin);
            setIsLocked(false);
          } else if (!targetIsPrivate) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`calendar_passcode_${calendarId}`);
            }
            setPasscodeHash('');
            setIsLocked(false);
          }
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to update privacy settings' };
        }
      } catch (err) {
        console.error('updatePrivacySettings error:', err);
        return { success: false, error: 'Network error. Please try again.' };
      }
    },
    [calendarId, passcodeHash]
  );

  return {
    isPrivate,
    isLocked,
    passcodeHash,
    unlockCalendar,
    lockCalendar,
    updatePrivacySettings,
    handleServerPrivacyState,
  };
}
