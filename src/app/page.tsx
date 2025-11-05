'use client'

import { useEffect } from 'react'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import ClientsSection from '../components/ClientsSection'
import FAQSection from '../components/FAQSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function Home() {
  useEffect(() => {
    // Load external scripts
    const scripts = [
      '/js/hooks.min.js',
      '/js/cf7-swv-index.js',
      '/js/cf7-index.js',
      '/js/app.js',
      '/js/home-page.js'
    ]

    scripts.forEach(src => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      document.body.appendChild(script)
    })

    return () => {
      // Cleanup scripts on unmount
      scripts.forEach(src => {
        const script = document.querySelector(`script[src="${src}"]`)
        if (script) {
          document.body.removeChild(script)
        }
      })
    }
  }, [])

  return (
    <>
      <Header />
      <main id="main" role="main" tabIndex={-1}>
        <HeroSection />
        <ClientsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}