const PageLoader = ({ label = 'Chargement...', fullScreen = false, compact = false }) => {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'min-h-[220px]'} flex items-center justify-center px-4 py-10`}>
      <div className="flex flex-col items-center">
        <img
          src="/3.png"
          alt={label}
          className={`${compact ? 'h-10 w-10' : 'h-14 w-14 sm:h-16 sm:w-16'} object-contain animate-pulse`}
        />
        <div className={`${compact ? 'mt-2 w-16' : 'mt-3 w-20 sm:w-24'} h-0.5 overflow-hidden rounded-full bg-slate-200`}>
          <div className="h-full w-1/2 rounded-full bg-[#2A4DEF] animate-[loading_0.9s_ease-in-out_infinite]" />
        </div>
        {label && <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>}
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

export default PageLoader
