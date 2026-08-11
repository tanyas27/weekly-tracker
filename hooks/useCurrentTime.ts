import { useState, useEffect } from 'react'
import { getCurrentHour, getTimezone, getCurrentMonthYear } from '../lib/time-utils'

export interface CurrentTimeState {
  hour: number
  timezone: string
}

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<CurrentTimeState>({
    hour: 7,
    timezone: ''
  })
  const [monthYear, setMonthYear] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime({ hour: getCurrentHour(), timezone: getTimezone() })
      setMonthYear(getCurrentMonthYear())
    }, 0)

    const interval = setInterval(() => {
      setCurrentTime({ hour: getCurrentHour(), timezone: getTimezone() })
      setMonthYear(getCurrentMonthYear())
    }, 60000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])


  return { currentTime, monthYear }
}

