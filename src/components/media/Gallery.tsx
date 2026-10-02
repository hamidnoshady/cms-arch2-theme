'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DecorativeMark } from '@/components/design/DecorativeMark'
import type { Locale } from '@/lib/cms/types'
import { cn } from '@/lib/utils/cn'

/**
 * Gallery + lightbox.
 *
 * A gallery library was not needed: the interaction is a grid of buttons and one
 * Radix Dialog (focus trap, Escape, focus restoration for free). Arrow keys and the
 * on-screen controls move between images; the counter is announced politely.
 */
export type GalleryItem = {
  alt: string
  height?: number
  id: string
  src: string
  srcSet?: string
  width?: number
}

export const Gallery = ({
  className,
  items,
  labels,
  locale,
}: {
  className?: string
  items: GalleryItem[]
  labels: { close: string; next: string; previous: string }
  locale: Locale
}) => {
  const [openIndex, setOpenIndex] = useState<null | number>(null)
  const [open, setOpen] = useState(false)

  const show = useCallback(
    (index: number) => {
      setOpenIndex(index)
      setOpen(true)
    },
    [],
  )

  if (items.length === 0) return null

  const step = (delta: number): void => {
    setOpenIndex((current) => {
      if (current === null) return current
      const next = (current + delta + items.length) % items.length
      return next
    })
  }

  const active = openIndex === null ? null : items[openIndex]

  return (
    <div className={className}>
      <ul className="grid-media">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              className="gallery-item gallery-item--button frame"
              onClick={() => show(index)}
              style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : '4 / 3' }}
              type="button"
            >
              <DecorativeMark className="top-1 end-1 hidden md:block" variant="corner" />
              <img
                alt={item.alt}
                className="frame__media"
                decoding="async"
                loading="lazy"
                height={item.height}
                sizes="(min-width: 768px) 33vw, 50vw"
                src={item.src}
                srcSet={item.srcSet}
                style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : '4 / 3' }}
                width={item.width}
              />
            </button>
          </li>
        ))}
      </ul>

      <DialogPrimitive.Root onOpenChange={setOpen} open={open}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="drawer__overlay" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 md:p-10"
            dir={locale === 'fa' ? 'rtl' : 'ltr'}
          >
            <DialogPrimitive.Title className="sr-only">
              {active?.alt ?? ''}
            </DialogPrimitive.Title>
            {active ? (
              <img
                alt={active.alt}
                className="max-h-[80svh] w-auto bg-surface object-contain"
                src={active.src}
                srcSet={active.srcSet}
              />
            ) : null}
            <div className={cn('mt-4 flex items-center gap-2 bg-surface p-1')}>
              <button aria-label={labels.previous} className="btn btn--square" onClick={() => step(-1)} type="button">
                <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
              </button>
              <span aria-live="polite" className="type-meta px-2">
                {openIndex === null ? '' : `${openIndex + 1} / ${items.length}`}
              </span>
              <button aria-label={labels.next} className="btn btn--square" onClick={() => step(1)} type="button">
                <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
              </button>
              <DialogPrimitive.Close aria-label={labels.close} className="btn btn--square" type="button">
                <X aria-hidden="true" size={18} strokeWidth={1.5} />
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
