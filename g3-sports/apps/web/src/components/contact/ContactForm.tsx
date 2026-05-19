'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Static site — simulate submission delay (replace with API call post-backend)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-cyan/20 rounded-2xl p-10 text-center"
          >
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
            <p className="text-muted text-sm">We&apos;ll get back to you within 24 hours.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="bg-card border border-white/5 rounded-2xl p-8 space-y-5"
          >
            {[
              { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Ravi Kumar' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'ravi@example.com' },
              { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Tournament inquiry' },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  required
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
                />
              </div>
            ))}

            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Tell us about your tournament or inquiry..."
                className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors resize-none"
              />
            </div>

            <GradientButton type="submit" variant="cyan" disabled={loading} className="w-full justify-center">
              {loading ? 'Sending…' : 'Send Message'}
            </GradientButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
