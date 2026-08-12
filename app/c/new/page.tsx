import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function NewCalendarPage() {
  const newCalendarId = nanoid(21)
  redirect(`/c/${newCalendarId}`)
}
