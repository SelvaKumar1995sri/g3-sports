import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-card mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-xl font-black mb-3">
            <span className="text-gradient-cyan">G3</span>
            <span className="text-white"> Sports</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Play. Score. Dominate.<br />
            The complete sports management ecosystem.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
            Platform
          </p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/features', label: 'Features' },
              { href: '/contact', label: 'Contact' },
              { href: '/admin/login', label: 'Admin Login' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-muted hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
            Download
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2.5 hover:border-cyan/30 hover:bg-cyan/5 transition-all"
            >
              <span className="text-lg">🍎</span>
              <div>
                <p className="text-[10px] text-muted">Download on the</p>
                <p className="text-sm font-semibold text-white">App Store</p>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2.5 hover:border-lime/30 hover:bg-lime/5 transition-all"
            >
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-[10px] text-muted">Get it on</p>
                <p className="text-sm font-semibold text-white">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} G3 Sports. All rights reserved.
      </div>
    </footer>
  );
}
