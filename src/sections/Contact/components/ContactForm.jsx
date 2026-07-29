import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import useMouseParallax from '../hooks/useMouseParallax';
import './ContactForm.css';

// Reusable 3D Glass Input Field
function GlassInputField({ label, type = 'text', name, value, onChange, placeholder, required }) {
  const containerRef = useRef(null);
  const { rotate, reflect, isHovered } = useMouseParallax(containerRef, { maxRotation: 3 });

  const style = {
    '--input-rot-x': `${rotate.x}deg`,
    '--input-rot-y': `${rotate.y}deg`,
    '--input-reflect-x': `${reflect.x}%`,
    '--input-reflect-y': `${reflect.y}%`,
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-input-wrapper ${isHovered ? 'hovered' : ''}`}
      style={style}
      onClick={(e) => {
        e.currentTarget.querySelector("input, textarea")?.focus();
      }}
    >
      <div className="input-reflection" />
      <label className="input-label">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="glass-input-field"
      />
      <div className="input-glow-border" />
    </div>
  );
}

// Reusable 3D Glass Textarea
function GlassTextAreaField({ label, name, value, onChange, placeholder, required, rows = 5 }) {
  const containerRef = useRef(null);
  const { rotate, reflect, isHovered } = useMouseParallax(containerRef, { maxRotation: 2.5 });

  const style = {
    '--input-rot-x': `${rotate.x}deg`,
    '--input-rot-y': `${rotate.y}deg`,
    '--input-reflect-x': `${reflect.x}%`,
    '--input-reflect-y': `${reflect.y}%`,
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-input-wrapper textarea-wrapper ${isHovered ? 'hovered' : ''}`}
      style={style}
    >
      <div className="input-reflection" />
      <label className="input-label">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="glass-input-field glass-textarea-field"
      />
      <div className="input-glow-border" />
    </div>
  );
}

export default function ContactForm() {
  const form = useRef();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const buttonRef = useRef(null);
  const { rotate: btnRot, reflect: btnReflect } = useMouseParallax(buttonRef, { maxRotation: 4 });

  const btnStyle = {
    '--btn-rot-x': `${btnRot.x}deg`,
    '--btn-rot-y': `${btnRot.y}deg`,
    '--btn-reflect-x': `${btnReflect.x}%`,
    '--btn-reflect-y': `${btnReflect.y}%`,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Without EmailJS credentials the send fails with an opaque error, so say
    // so plainly and point at the mail link instead of silently retrying.
    if (!serviceId || !templateId || !publicKey) {
      setErrorMsg("Messaging isn't configured yet — please email us directly at lead_sc@thapar.edu.");
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    emailjs.sendForm(serviceId, templateId, form.current, { publicKey })
      .then(() => {
        setIsSubmitting(false);
        setIsSuccess(true);

        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      })
      .catch((error) => {
        console.error("EmailJS Error:", error);
        setIsSubmitting(false);
        setErrorMsg("That didn't go through. Please try again, or email us at lead_sc@thapar.edu.");
      });
  };

  return (
    <div className="contact-form-container">
      {isSuccess ? (
        <div className="success-glass-card">
          <CheckCircle className="success-icon" />
          <h3 className="success-title">Message Sent Successfully</h3>
          <p className="success-desc">
            Thank you for reaching out. The LEAD team will review your message and get back to you shortly.
          </p>
          <button onClick={() => setIsSuccess(false)} className="success-btn">
            Send Another Message
          </button>
        </div>
      ) : (
        <form 
          ref={form}
          onSubmit={handleSubmit} 
          className="contact-form"
        >
          <div className="form-row">
            <GlassInputField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Abc"
              required
            />
            <GlassInputField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="abc@gmail.com"
              required
            />
          </div>
          <GlassInputField
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            required
          />
          <GlassTextAreaField
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Brief about your message"
            required
          />
          <button
            ref={buttonRef}
            type="submit"
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
            style={btnStyle}
            disabled={isSubmitting}
          >
            {/* Ambient glows and reflex inside button */}
            <div className="btn-reflection" />
            <div className="btn-shine" />
            
            <span className="btn-content">
              {isSubmitting ? (
                <>Sending Message...</>
              ) : (
                <>
                  Send Message
                  <ArrowRight className="btn-arrow" />
                </>
              )}
            </span>
          </button>

          {errorMsg && (
            <p className="form-error" role="alert">
              <AlertCircle className="form-error-icon" />
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
