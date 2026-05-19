interface StatCardProps {
  label: string;
  value: number | string;
  accent?: 'cyan' | 'lime' | 'pink';
  sublabel?: string;
}

const accentClass: Record<string, string> = {
  cyan: 'text-cyan',
  lime: 'text-lime',
  pink: 'text-pink',
};

export default function StatCard({ label, value, accent = 'cyan', sublabel }: StatCardProps) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-6">
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-black ${accentClass[accent]}`}>{value}</p>
      {sublabel && <p className="text-muted text-xs mt-2">{sublabel}</p>}
    </div>
  );
}
