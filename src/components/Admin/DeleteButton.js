'use client'

const DeleteButton = ({ action, id, label }) => (
  <form
    action={action}
    onSubmit={(e) => {
      if (!window.confirm(`Delete ${label}?`)) e.preventDefault()
    }}
  >
    <input type="hidden" name="id" value={id} />
    <button type="submit" className="text-sm opacity-60 hover:opacity-100 hover:text-contrast">
      Delete
    </button>
  </form>
)

export default DeleteButton
