import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Planner',
  description: 'Your personal DailyForest planner schedule.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
