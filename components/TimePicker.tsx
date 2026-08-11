import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface TimePickerProps {
  /** 24-hour "HH:MM" string, e.g. "07:00" or "14:30" */
  value: string
  onChange: (value: string) => void
  isDark: boolean
}

type Period = 'AM' | 'PM'

function parseValue(value: string) {
  const [hStr, mStr] = (value || '07:00').split(':')
  const parsedHour = parseInt(hStr, 10)
  const parsedMinute = parseInt(mStr, 10)
  const hour24 = isNaN(parsedHour) ? 7 : Math.min(Math.max(parsedHour, 0), 23)
  const minute = isNaN(parsedMinute) ? 0 : Math.min(Math.max(parsedMinute, 0), 59)
  const period: Period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, minute, period }
}

function toValue(hour12: number, minute: number, period: Period) {
  const normalizedHour12 = ((hour12 - 1 + 12) % 12) + 1
  let hour24 = normalizedHour12 % 12
  if (period === 'PM') hour24 += 12
  const normalizedMinute = ((minute % 60) + 60) % 60
  return `${hour24.toString().padStart(2, '0')}:${normalizedMinute.toString().padStart(2, '0')}`
}

export function TimePicker({ value, onChange, isDark }: TimePickerProps) {
  const { hour12, minute, period } = parseValue(value)

  const setHour = (newHour12: number) => onChange(toValue(newHour12, minute, period))
  const setMinute = (newMinute: number) => onChange(toValue(hour12, newMinute, period))
  const setPeriod = (newPeriod: Period) => onChange(toValue(hour12, minute, newPeriod))

  const handleDigitInput = (raw: string, kind: 'hour' | 'minute') => {
    const numeric = raw.replace(/\D/g, '').slice(-2)
    if (numeric === '') return
    const parsed = parseInt(numeric, 10)
    if (kind === 'hour' && parsed >= 1 && parsed <= 12) setHour(parsed)
    if (kind === 'minute' && parsed >= 0 && parsed <= 59) setMinute(parsed)
  }

  const stepperButtonClass = isDark
    ? 'text-gray-400 hover:text-white hover:bg-white/10'
    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'

  const digitBoxClass = isDark
    ? 'border-white/10 bg-gray-900/40 text-white focus:ring-blue-500'
    : 'border-white/40 bg-white/50 text-gray-900 focus:ring-gray-900'

  const periodButtonClass = (active: boolean) =>
    active
      ? isDark
        ? 'border-transparent bg-[#BDCC8D] text-gray-900 shadow-md hover:bg-[#D3E1C5]'
        : 'border-transparent bg-[#8BB783] text-gray-900 shadow-md hover:bg-[#75AC83]'
      : isDark
        ? 'border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/60'
        : 'border-white/30 bg-white/30 text-gray-700 hover:bg-white/50'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Hour stepper */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setHour(hour12 + 1)}
          aria-label="Increase hour"
          className={`w-8 h-6 flex items-center justify-center rounded-md transition-colors ${stepperButtonClass}`}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={hour12.toString().padStart(2, '0')}
          onChange={(e) => handleDigitInput(e.target.value, 'hour')}
          aria-label="Hour"
          className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-xl border backdrop-blur-sm outline-none focus:ring-2 focus:border-transparent transition-colors ${digitBoxClass}`}
        />
        <button
          type="button"
          onClick={() => setHour(hour12 - 1)}
          aria-label="Decrease hour"
          className={`w-8 h-6 flex items-center justify-center rounded-md transition-colors ${stepperButtonClass}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className={`text-2xl sm:text-3xl font-bold pb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>:</div>

      {/* Minute stepper */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setMinute(minute + 1)}
          aria-label="Increase minute"
          className={`w-8 h-6 flex items-center justify-center rounded-md transition-colors ${stepperButtonClass}`}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={minute.toString().padStart(2, '0')}
          onChange={(e) => handleDigitInput(e.target.value, 'minute')}
          aria-label="Minute"
          className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-xl border backdrop-blur-sm outline-none focus:ring-2 focus:border-transparent transition-colors ${digitBoxClass}`}
        />
        <button
          type="button"
          onClick={() => setMinute(minute - 1)}
          aria-label="Decrease minute"
          className={`w-8 h-6 flex items-center justify-center rounded-md transition-colors ${stepperButtonClass}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* AM/PM toggle */}
      <div className="flex flex-col gap-1 ml-1">
        <button
          type="button"
          onClick={() => setPeriod('AM')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border backdrop-blur-sm transition-colors ${periodButtonClass(period === 'AM')}`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => setPeriod('PM')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border backdrop-blur-sm transition-colors ${periodButtonClass(period === 'PM')}`}
        >
          PM
        </button>
      </div>
    </div>
  )
}
