import { useState, type FormEvent } from 'react'

export function CreateTeamForm({
  onCreate,
  pending,
}: {
  onCreate: (name: string) => void
  pending: boolean
}) {
  const [name, setName] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim())
    setName('')
  }
  return (
    <form className="inline-form" onSubmit={submit}>
      <input
        aria-label="新しいチーム名"
        placeholder="新しいチーム名"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={30}
      />
      <button className="button primary" disabled={pending}>作成</button>
    </form>
  )
}
