export default function EmptyState({ icon: Icon, title, children, action, className = "" }) {
  return (
    <div className={`card flex flex-col items-center text-center px-6 py-14 ${className}`}>
      {Icon && (
        <span className="mb-5 grid place-items-center w-16 h-16 rounded-[22px] bg-accent-soft text-accent-text">
          <Icon className="w-7 h-7" />
        </span>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-sm text-text-2 leading-relaxed">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
