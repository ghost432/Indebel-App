const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const colors = {
    blue: {
      bg: 'bg-[#082151]/5',
      border: 'border-[#082151]/20',
      text: 'text-[#082151]',
      iconBg: 'bg-[#082151]',
      iconText: 'text-white'
    },
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-950',
      iconBg: 'bg-emerald-600',
      iconText: 'text-white'
    },
    yellow: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-950',
      iconBg: 'bg-amber-500',
      iconText: 'text-white'
    },
    red: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-950',
      iconBg: 'bg-[#c02525]',
      iconText: 'text-white'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-950',
      iconBg: 'bg-purple-600',
      iconText: 'text-white'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-950',
      iconBg: 'bg-[#082151]',
      iconText: 'text-white'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-950',
      iconBg: 'bg-[#c02525]',
      iconText: 'text-white'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-950',
      iconBg: 'bg-emerald-600',
      iconText: 'text-white'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-[#c02525]',
      iconBg: 'bg-[#c02525]',
      iconText: 'text-white'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-950',
      iconBg: 'bg-teal-600',
      iconText: 'text-white'
    },
    gray: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-950',
      iconBg: 'bg-slate-500',
      iconText: 'text-white'
    }
  }

  const scheme = colors[color] || colors.blue;

  return (
    <div className={`group relative overflow-hidden rounded-3xl border ${scheme.border} ${scheme.bg} p-5 shadow-[0_18px_45px_rgba(8,33,81,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(8,33,81,0.08)]`}>
      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[48px] bg-white/40" />
      <div className="flex items-center justify-between">
        <div className="relative min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">{title}</p>
          <p className={`text-3xl font-black ${scheme.text}`}>{value}</p>
          {trend && (
            <p className={`text-sm font-bold mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-[#c02525]'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${scheme.iconBg} relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${scheme.iconText}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
