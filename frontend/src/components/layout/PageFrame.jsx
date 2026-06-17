import Navbar from './Navbar.jsx';

export default function PageFrame({
  children,
  title,
  subtitle,
  actions,
  centered = false,
  showNavbar = true,
  width = '7xl',
  className = '',
  contentClassName = '',
}) {
  const maxWidthClass = width === '5xl' ? 'max-w-5xl' : width === '6xl' ? 'max-w-6xl' : 'max-w-7xl';

  return (
    <div className="usv-page-shell">
      {showNavbar && <Navbar />}
      <main className={`${centered ? 'usv-page-frame usv-page-frame--centered' : `${maxWidthClass} usv-page-frame`} ${className}`.trim()}>
        {(title || subtitle || actions) && !centered && (
          <header className="usv-page-hero">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                {title && <h1 className="usv-page-title">{title}</h1>}
                {subtitle && <p className="usv-page-subtitle">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </header>
        )}

        {centered ? (
          <div className="w-full max-w-4xl">
            {(title || subtitle || actions) && (
              <header className="mb-8 text-center">
                {title && <h1 className="usv-page-title">{title}</h1>}
                {subtitle && <p className="usv-page-subtitle mx-auto">{subtitle}</p>}
                {actions && <div className="mt-6 flex justify-center gap-2">{actions}</div>}
              </header>
            )}
            <div className={contentClassName}>{children}</div>
          </div>
        ) : (
          <div className={contentClassName}>{children}</div>
        )}
      </main>
    </div>
  );
}