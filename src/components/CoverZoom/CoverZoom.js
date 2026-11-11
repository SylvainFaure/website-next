'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

// Cover thumbnail that opens the full-size cover in a modal.
// Native <dialog>: Esc, focus handling and the backdrop come from the browser.
const CoverZoom = ({ src, alt, width, height, className = '' }) => {
  const dialogRef = useRef(null)
  const [open, setOpen] = useState(false)

  const show = () => {
    setOpen(true) // the full-size image only loads once opened
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={`Enlarge: ${alt}`}
        className="shrink-0 cursor-zoom-in rounded-sm transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-contrast"
      >
        <Image src={src} alt={alt} width={width} height={height} className={`object-cover rounded-sm ${className}`} />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        // A click on the backdrop targets the dialog itself
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto overflow-visible bg-transparent p-0 backdrop:bg-black/80"
      >
        {open && (
          <div className="relative">
            <Image
              src={src}
              alt={alt}
              width={1000}
              height={1500}
              sizes="(max-width: 768px) 90vw, 600px"
              className="h-auto max-h-[88vh] w-auto max-w-[90vw] rounded-md object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              autoFocus
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-secondary text-xl leading-none text-text shadow-lg hover:text-contrast"
            >
              ×
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}

export default CoverZoom
