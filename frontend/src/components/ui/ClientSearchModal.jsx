import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Modal } from './Modal'

export const ClientSearchModal = ({ isOpen, onClose }) => {
  const [term, setTerm] = React.useState('')
  const navigate = useNavigate()
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setTerm('')
    }
  }, [isOpen])

  const submit = e => {
    e?.preventDefault()
    const q = term.trim()
    if (!q) return
    navigate(`/dashboard?q=${encodeURIComponent(q)}`)
    onClose?.()
  }

  const actions = term.trim()
    ? [
        {
          id: 'search',
          label: `Buscar "${term.trim()}"`,
          variant: 'primary',
          icon: <Search className='h-4 w-4' />,
          onClick: submit,
        },
      ]
    : []

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title='Buscar Clientes'
      size='lg'
      icon={<Search className='h-6 w-6 text-primary-400' />}
      actions={actions}
      initialFocusRef={inputRef}
    >
      <form onSubmit={submit}>
        <div className='flex items-center gap-3'>
          <Search className='h-6 w-6 text-text-muted shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder='Buscar clientes por nombre o industria…'
            className='flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base
             border border-white/10 rounded-lg px-3 py-2
             focus:border-white/30 focus:ring-1 focus:ring-white/20'
            aria-label='Buscar clientes'
            data-autofocus
          />
        </div>
      </form>
    </Modal>
  )
}
