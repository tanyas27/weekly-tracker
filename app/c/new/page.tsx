import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function NewCalendarPage() {
  const newCalendarId = nanoid(21)
  redirect(`/c/${newCalendarId}`)
}
