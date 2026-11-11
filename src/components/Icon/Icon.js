'use client'
import { useState, useEffect } from 'react'

export default function Icon({ name, className = '', size = 'small', svgProps = {}, ...props }) {
  const [Component, setComponent] = useState(null)

  useEffect(() => { 
    async function loadIcon() {
      if (!name) return false
      try {
        const IconModule = await import(`./icons/${name}`);
        setComponent(() => IconModule.default || IconModule);
      } catch (error) {
        console.error(`Icon "${name}" could not be loaded.`);
      }
    }
    loadIcon();
  }, [name])
  // const Component = icons[name]
  const sizes = {
    small: 'w-3 h-3 min-w-3 min-h-3 md:w-4 md:h-4 md:min-w-4 md:min-h-4',
    medium: 'w-4 h-4 min-w-4 min-h-4 md:w-6 md:h-6 md:min-w-6 md:min-h-6',
    large: 'w-10 h-10 min-w-10 min-h-10',
    xlarge: 'w-14 h-14 min-w-14 min-h-14',
    custom: ''
  }

  return (
    <i {...props} className={`${sizes[size]} inline-flex justify-center items-center ${className}`}>
      {Component ? <Component {...(svgProps ? svgProps : {})} /> : null}
    </i>
  )
}
