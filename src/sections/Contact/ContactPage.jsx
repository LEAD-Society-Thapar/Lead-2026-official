import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { ArrowRight, Check, AlertCircle } from 'lucide-react'
import './ContactPage.css'

// LEAD — Contact. A warm, editorial counterpoint to the site's cold 3D pages:
// one amber accent in a cool cosmic field, a serif headline that reads like the
// start of a message. Wiring (EmailJS, field names, socials) matches the
// society's existing template so nothing downstream changes.

const LINES = [
  { label: 'Email', value: 'lead_sc@thapar.edu', href: 'mailto:lead_sc@thapar.edu' },
  {
    label: 'Campus',
    value: 'Thapar Institute, Patiala',
    href: 'https://maps.google.com/?q=Thapar+Institute+of+Engineering+and+Technology+Patiala',
  },
  { label: 'Response', value: 'Within 2–3 days' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/lead_tiet' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/lead-tiet/' },
  { label: 'GitHub', href: 'https://github.com/LEAD-Society-Thapar' },
]

const FIELDS = [
  { name: 'name', label: 'Your name', type: 'text', placeholder: 'Aisha Kapoor' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { name: 'subject', label: "What's this about?", type: 'text', placeholder: 'Joining / Sponsorship / Something else' },
]

export default function ContactPage() {
  const formRef = useRef(null)
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    // Without credentials the send fails opaquely — say so and point at email.
    if (!serviceId || !templateId || !publicKey) {
      setError("Messaging isn't configured yet — please email us directly at lead_sc@thapar.edu.")
      return
    }

    setError('')
    setStatus('sending')

    emailjs
      .sendForm(serviceId, templateId, formRef.current, { publicKey })
      .then(() => {
        setStatus('sent')
        setValues({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setStatus('idle'), 6000)
      })
      .catch((err) => {
        console.error('EmailJS Error:', err)
        setStatus('idle')
        setError("That didn't go through. Please try again, or email us at lead_sc@thapar.edu.")
      })
  }

  return (
    <main className="contactx">
      <div className="contactx-glow contactx-glow--cool" aria-hidden="true" />
      <div className="contactx-glow contactx-glow--warm" aria-hidden="true" />

      <div className="contactx-grid">
        {/* ── Left: the invitation ───────────────────────────── */}
        <section className="contactx-intro">
          <p className="contactx-eyebrow">Get in touch</p>

          <h1 className="contactx-title">
            Say hello.<span className="contactx-caret" aria-hidden="true" />
          </h1>

          <p className="contactx-lede">
            Want to join LEAD, partner on an event, or just have a question?
            Start typing — a real person reads every message.
          </p>

          <dl className="contactx-lines">
            {LINES.map((line) => (
              <div className="contactx-line" key={line.label}>
                <dt>{line.label}</dt>
                <dd>
                  {line.href ? (
                    <a
                      href={line.href}
                      target={line.href.startsWith('http') ? '_blank' : undefined}
                      rel={line.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {line.value}
                    </a>
                  ) : (
                    line.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="contactx-follow">
            <span className="contactx-follow-label">Follow</span>
            <nav className="contactx-follow-links">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* ── Right: the message ─────────────────────────────── */}
        <section className="contactx-compose">
          {status === 'sent' ? (
            <div className="contactx-sent" role="status">
              <span className="contactx-sent-mark">
                <Check strokeWidth={2.5} />
              </span>
              <h2>Message sent</h2>
              <p>Thanks for reaching out. We'll get back to you within a few days.</p>
              <button type="button" className="contactx-sent-again" onClick={() => setStatus('idle')}>
                Write another
              </button>
            </div>
          ) : (
            <form ref={formRef} className="contactx-form" onSubmit={handleSubmit} noValidate>
              {FIELDS.map((f) => (
                <div className="contactx-field" key={f.name}>
                  <label htmlFor={`cx-${f.name}`}>{f.label}</label>
                  <input
                    id={`cx-${f.name}`}
                    name={f.name}
                    type={f.type}
                    value={values[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required
                    autoComplete={f.name === 'name' ? 'name' : f.name === 'email' ? 'email' : 'off'}
                  />
                </div>
              ))}

              <div className="contactx-field">
                <label htmlFor="cx-message">Message</label>
                <textarea
                  id="cx-message"
                  name="message"
                  value={values.message}
                  onChange={handleChange}
                  placeholder="Tell us what you have in mind…"
                  rows={4}
                  required
                />
              </div>

              {error && (
                <p className="contactx-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  {error}
                </p>
              )}

              <button type="submit" className="contactx-send" disabled={status === 'sending'}>
                <span>{status === 'sending' ? 'Sending…' : 'Send message'}</span>
                <ArrowRight aria-hidden="true" />
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
