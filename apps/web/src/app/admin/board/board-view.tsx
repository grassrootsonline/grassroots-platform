'use client'

import { useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'
import {
  createCardAction,
  deleteCardAction,
  moveCardAction,
  updateCardAction,
} from '@/actions/admin-board.actions'
import s from './board.module.css'

type CardType = 'bug' | 'idea' | 'planning'
type CardStatus = 'inbox' | 'discussing' | 'handoff' | 'done'

interface Card {
  id: string
  type: CardType
  title: string
  body: string | null
  status: CardStatus
  position: number
  createdAt: Date
  updatedAt: Date
  authorId: string | null
  authorDisplayName: string | null
  authorUsername: string | null
}

interface CurrentUser {
  id: string
  displayName: string
  username: string
}

interface BoardViewProps {
  initialCards: Card[]
  currentUser: CurrentUser | null
}

const TYPE_META: Record<CardType, { icon: string; label: string }> = {
  bug: { icon: 'bug', label: 'Bug' },
  idea: { icon: 'bulb', label: 'Idea' },
  planning: { icon: 'clipboard-list', label: 'Planning' },
}

const COLUMNS: { status: CardStatus; label: string; icon: string }[] = [
  { status: 'inbox', label: 'Inbox', icon: 'inbox' },
  { status: 'discussing', label: 'Discussing', icon: 'messages' },
  { status: 'handoff', label: 'Handoff', icon: 'arrow-right-circle' },
  { status: 'done', label: 'Done', icon: 'circle-check' },
]

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function authorName(card: Pick<Card, 'authorDisplayName' | 'authorUsername'>): string {
  return card.authorDisplayName || card.authorUsername || '[deleted]'
}

function computePosition(cards: Card[], targetStatus: CardStatus, beforeId: string | null, draggingId: string): number {
  const list = cards
    .filter((c) => c.status === targetStatus && c.id !== draggingId)
    .sort((a, b) => a.position - b.position)

  if (!beforeId) {
    const last = list[list.length - 1]
    return last ? last.position + 1 : 1
  }
  const idx = list.findIndex((c) => c.id === beforeId)
  if (idx === -1) {
    const last = list[list.length - 1]
    return last ? last.position + 1 : 1
  }
  const before = list[idx]
  const prev = list[idx - 1]
  return prev ? (prev.position + before.position) / 2 : before.position / 2
}

export function BoardView({ initialCards, currentUser }: BoardViewProps) {
  const [cards, setCards] = useState(initialCards)
  const [overlay, setOverlay] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ type: CardType; title: string; body: string; status: CardStatus }>({
    type: 'idea',
    title: '',
    body: '',
    status: 'inbox',
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate(status: CardStatus) {
    setForm({ type: 'idea', title: '', body: '', status })
    setEditingId(null)
    setOverlay('create')
  }

  function openEdit(card: Card) {
    setForm({ type: card.type, title: card.title, body: card.body ?? '', status: card.status })
    setEditingId(card.id)
    setOverlay('edit')
  }

  function closeOverlay() {
    setOverlay(null)
    setEditingId(null)
  }

  function handleDragStart(id: string) {
    return (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      setDraggingId(id)
    }
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverStatus(null)
    setDragOverCardId(null)
  }

  function handleColumnDragOver(status: CardStatus) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      if (dragOverStatus !== status || dragOverCardId !== null) {
        setDragOverStatus(status)
        setDragOverCardId(null)
      }
    }
  }

  function handleColumnDragLeave(status: CardStatus) {
    return () => {
      if (dragOverStatus === status) setDragOverStatus(null)
    }
  }

  function handleCardDragOver(id: string, status: CardStatus) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (dragOverCardId !== id || dragOverStatus !== status) {
        setDragOverCardId(id)
        setDragOverStatus(status)
      }
    }
  }

  function handleMove(targetStatus: CardStatus, beforeId: string | null) {
    const dragId = draggingId
    setDraggingId(null)
    setDragOverStatus(null)
    setDragOverCardId(null)
    if (!dragId || dragId === beforeId) return

    const prevCard = cards.find((c) => c.id === dragId)
    if (!prevCard) return
    const newPosition = computePosition(cards, targetStatus, beforeId, dragId)
    setCards((prev) => prev.map((c) => (c.id === dragId ? { ...c, status: targetStatus, position: newPosition } : c)))
    startTransition(async () => {
      try {
        await moveCardAction(dragId, { status: targetStatus, position: newPosition })
      } catch {
        setCards((prev) => prev.map((c) => (c.id === dragId ? prevCard : c)))
        toast("Couldn't move the card. Try again.")
      }
    })
  }

  function handleSave() {
    const title = form.title.trim()
    if (!title) return
    const body = form.body.trim()

    if (overlay === 'edit' && editingId) {
      const id = editingId
      const prevCard = cards.find((c) => c.id === id)
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, type: form.type, title, body: body || null, status: form.status, updatedAt: new Date() } : c))
      )
      closeOverlay()
      startTransition(async () => {
        try {
          await updateCardAction(id, { type: form.type, title, body: body || undefined, status: form.status })
        } catch {
          if (prevCard) setCards((prev) => prev.map((c) => (c.id === id ? prevCard : c)))
          toast("Couldn't save changes. Try again.")
        }
      })
      return
    }

    const tempId = crypto.randomUUID()
    const status = form.status
    const siblings = cards.filter((c) => c.status === status)
    const optimisticPosition = siblings.length ? Math.max(...siblings.map((c) => c.position)) + 1 : 1

    setCards((prev) => [
      ...prev,
      {
        id: tempId,
        type: form.type,
        title,
        body: body || null,
        status,
        position: optimisticPosition,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: currentUser?.id ?? null,
        authorDisplayName: currentUser?.displayName ?? null,
        authorUsername: currentUser?.username ?? null,
      },
    ])
    closeOverlay()
    startTransition(async () => {
      try {
        const inserted = await createCardAction({ type: form.type, title, body: body || undefined, status })
        setCards((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? { ...c, id: inserted.id, position: parseFloat(inserted.position), createdAt: new Date(inserted.createdAt), updatedAt: new Date(inserted.updatedAt) }
              : c
          )
        )
      } catch {
        setCards((prev) => prev.filter((c) => c.id !== tempId))
        toast("Couldn't add the card. Try again.")
      }
    })
  }

  function handleDelete() {
    if (!editingId) return
    const id = editingId
    const prevCard = cards.find((c) => c.id === id)
    setCards((prev) => prev.filter((c) => c.id !== id))
    closeOverlay()
    startTransition(async () => {
      try {
        await deleteCardAction(id)
      } catch {
        if (prevCard) setCards((prev) => [...prev, prevCard])
        toast("Couldn't delete the card. Try again.")
      }
    })
  }

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null
  const isEdit = overlay === 'edit'

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Task board</h1>
          <p className={s.subtitle}>Log bugs, ideas, and planning items. The advisor reads these to turn into handoffs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate('inbox')}>
          <i className="ti ti-plus" aria-hidden="true" />
          New card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="empty-state-icon">
            <i className="ti ti-layout-kanban" aria-hidden="true" />
          </div>
          <p className="empty-state-title">The board is empty</p>
          <p className="empty-state-body">Add your first card to start logging bugs, ideas, and planning items.</p>
          <button className="btn btn-primary" onClick={() => openCreate('inbox')}>
            <i className="ti ti-plus" aria-hidden="true" />
            Add a card
          </button>
        </div>
      ) : (
        <div className={s.board}>
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.status === col.status).sort((a, b) => a.position - b.position)
            const isDropTarget = dragOverStatus === col.status && draggingId
            return (
              <div
                key={col.status}
                className={`${s.column} ${isDropTarget ? s.isDropTarget : ''}`}
                onDragOver={handleColumnDragOver(col.status)}
                onDragLeave={handleColumnDragLeave(col.status)}
                onDrop={(e) => {
                  e.preventDefault()
                  handleMove(col.status, null)
                }}
              >
                <div className={s.colHead}>
                  <span className={s.colTitle}>
                    <i className={`ti ti-${col.icon}`} aria-hidden="true" />
                    {col.label}
                  </span>
                  <span className={s.colCount}>{colCards.length}</span>
                  <button
                    className={`${s.rowAction} ${s.colAdd}`}
                    onClick={() => openCreate(col.status)}
                    aria-label="Add card to this column"
                  >
                    <i className="ti ti-plus" aria-hidden="true" />
                  </button>
                </div>
                <div className={s.colBody}>
                  {colCards.map((c) => {
                    const meta = TYPE_META[c.type]
                    const isCardDragging = draggingId === c.id
                    const isDropBefore = dragOverCardId === c.id && !!draggingId && draggingId !== c.id
                    return (
                      <div
                        key={c.id}
                        className={`${s.card} ${isCardDragging ? s.isDragging : ''} ${isDropBefore ? s.isDropBefore : ''}`}
                        draggable
                        onDragStart={handleDragStart(c.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleCardDragOver(c.id, col.status)}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMove(col.status, c.id)
                        }}
                        onClick={() => openEdit(c)}
                      >
                        <i className={`ti ti-grip-vertical ${s.dragHandle}`} aria-hidden="true" />
                        <div className={s.cardTop}>
                          <span className={`badge badge-muted ${s.typeBadge}`}>
                            <i className={`ti ti-${meta.icon}`} aria-hidden="true" />
                            {meta.label}
                          </span>
                        </div>
                        <p className={s.cardTitle}>{c.title}</p>
                        {c.body && <p className={s.cardBody}>{c.body}</p>}
                        <div className={s.cardFoot}>
                          <Avatar name={c.authorId ? authorName(c) : '?'} size="sm" />
                          <span className={s.footAuthor}>{authorName(c)}</span>
                          <span className={s.footDate}>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {colCards.length === 0 && (
                    <div className={s.colEmpty}>
                      <i className="ti ti-plant-2" aria-hidden="true" />
                      <span>No cards yet</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="sheet-backdrop"
            onClick={closeOverlay}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
              className="sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className={s.sheetHeader}>
                <h2 className={s.sheetTitle}>{isEdit ? 'Edit card' : 'New card'}</h2>
                <button className={s.rowAction} onClick={closeOverlay} aria-label="Close">
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>

              <div className={s.fieldsWrap}>
                <div className="field">
                  <label className="field-label">Type</label>
                  <div className={s.seg}>
                    {(Object.keys(TYPE_META) as CardType[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`${s.segBtn} ${form.type === k ? s.segBtnActive : ''}`}
                        onClick={() => setForm((f) => ({ ...f, type: k }))}
                      >
                        <i className={`ti ti-${TYPE_META[k].icon}`} aria-hidden="true" />
                        {TYPE_META[k].label}
                      </button>
                    ))}
                  </div>
                </div>

                {isEdit && (
                  <div className="field">
                    <label className="field-label">Status</label>
                    <div className={s.seg}>
                      {COLUMNS.map((col) => (
                        <button
                          key={col.status}
                          type="button"
                          className={`${s.segBtn} ${form.status === col.status ? s.segBtnActive : ''}`}
                          onClick={() => setForm((f) => ({ ...f, status: col.status }))}
                        >
                          <i className={`ti ti-${col.icon}`} aria-hidden="true" />
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="field-label">Title</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Short summary of the bug, idea, or item"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div className="field">
                  <label className="field-label">
                    Body <span style={{ color: 'var(--color-secondary)', fontWeight: 'var(--weight-regular)' }}>· optional</span>
                  </label>
                  <textarea
                    className="input"
                    style={{ minHeight: '150px', resize: 'vertical', fontSize: '16px' }}
                    placeholder="Repro steps, desired behaviour, or detail."
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                </div>

                {isEdit && editingCard && (
                  <div className={s.metaRow}>
                    <span>Author <b>{authorName(editingCard)}</b></span>
                    <span>Created <b>{formatDate(editingCard.createdAt)}</b></span>
                    <span>Updated <b>{formatDate(editingCard.updatedAt)}</b></span>
                  </div>
                )}

                <div className={s.actionsRow}>
                  <button className="btn btn-primary" disabled={isPending} onClick={handleSave}>
                    {isEdit ? 'Save changes' : 'Add card'}
                  </button>
                  <button className="btn btn-secondary" onClick={closeOverlay}>
                    Cancel
                  </button>
                  {isEdit && (
                    <button className={`btn btn-ghost ${s.deleteBtn}`} disabled={isPending} onClick={handleDelete}>
                      <i className="ti ti-trash" aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
