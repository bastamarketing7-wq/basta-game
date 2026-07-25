/** هيكل التطبيق والتنقل بين الشاشات. */

import { useCallback, useEffect, useState } from 'react'
import { APP, IDENTITY, LOGO } from './config/identity'
import HomeScreen from './screens/HomeScreen'
import ClientFormScreen from './screens/ClientFormScreen'
import AnalyzeScreen from './screens/AnalyzeScreen'
import ReviewScreen from './screens/ReviewScreen'
import ReportScreen from './screens/ReportScreen'
import SettingsScreen from './screens/SettingsScreen'

export type Route =
  | { name: 'home' }
  | { name: 'client'; id?: string }
  | { name: 'analyze'; id: string }
  | { name: 'review'; id: string }
  | { name: 'report'; id: string }
  | { name: 'settings' }

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })

  const go = useCallback((r: Route) => {
    setRoute(r)
    window.scrollTo({ top: 0 })
  }, [])

  // تحذير قبل مغادرة الصفحة أثناء التحليل
  useEffect(() => {
    if (route.name !== 'analyze') return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [route.name])

  const navItems: Array<{ key: Route['name']; label: string; route: Route }> = [
    { key: 'home', label: 'الرئيسية', route: { name: 'home' } },
    { key: 'client', label: 'عميل جديد', route: { name: 'client' } },
    { key: 'settings', label: 'الإعدادات', route: { name: 'settings' } },
  ]

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <img src={LOGO.full} alt={`${IDENTITY.nameAr} — ${IDENTITY.tagline}`} />
            <span className="brand-text">
              <strong>{APP.nameAr}</strong>
              <span>{IDENTITY.nameAr}</span>
            </span>
          </div>
          <nav className="nav" aria-label="التنقل الرئيسي">
            {navItems.map((n) => (
              <button
                key={n.key}
                className={route.name === n.key ? 'active' : ''}
                onClick={() => go(n.route)}
                aria-current={route.name === n.key ? 'page' : undefined}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {route.name === 'home' && <HomeScreen go={go} />}
        {route.name === 'client' && <ClientFormScreen id={route.id} go={go} />}
        {route.name === 'analyze' && <AnalyzeScreen id={route.id} go={go} />}
        {route.name === 'review' && <ReviewScreen id={route.id} go={go} />}
        {route.name === 'report' && <ReportScreen id={route.id} go={go} />}
        {route.name === 'settings' && <SettingsScreen />}
      </main>
    </div>
  )
}
