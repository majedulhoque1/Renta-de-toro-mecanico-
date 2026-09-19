import { useCallback, useSyncExternalStore } from 'react'

import { en } from '../i18n/en'
import { es } from '../i18n/es'
import type { EventTypeKey } from './types'

// Admin (Felix OS) language. English is the source language of every admin
// string; Spanish lives in the ES map below and t() falls back to the English
// text when a key is missing. Stored per-device in localStorage — the admin is
// client-only behind a login, so there is no SSR/hydration concern here (the
// server snapshot is always 'en').

export type OSLang = 'en' | 'es'

const LANG_KEY = 'felix_os_lang'
const listeners = new Set<() => void>()

function readLang(): OSLang {
  if (typeof window === 'undefined') return 'en'
  try {
    return window.localStorage.getItem(LANG_KEY) === 'es' ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

export function setOSLang(lang: OSLang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang)
  } catch {
    // private mode etc. — the toggle just won't persist
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const ES: Record<string, string> = {
  // Navigation / shell
  Dashboard: 'Panel',
  Home: 'Inicio',
  Leads: 'Clientes potenciales',
  Bookings: 'Reservas',
  Calendar: 'Calendario',
  Customers: 'Clientes',
  Clients: 'Clientes',
  Payments: 'Pagos',
  Pay: 'Pagos',
  Settings: 'Ajustes',
  'Log out': 'Cerrar sesión',
  'Open menu': 'Abrir menú',
  'Close menu': 'Cerrar menú',
  'Demo data': 'Datos de prueba',
  'Loading…': 'Cargando…',
  Language: 'Idioma',
  active: 'activos',
  event: 'evento',
  events: 'eventos',

  // Dashboard
  'Good morning, Felix 👋': 'Buenos días, Felix 👋',
  'Upcoming events (30d)': 'Próximos eventos (30 d)',
  'Expected revenue': 'Ingresos esperados',
  'Open leads': 'Leads abiertos',
  'Quotes awaiting': 'Cotizaciones pendientes',
  'Follow-ups due': 'Seguimientos pendientes',
  "Today's priorities": 'Prioridades de hoy',
  'Nothing urgent right now.': 'Nada urgente por ahora.',

  // Statuses
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  quote_sent: 'Cotización enviada',
  negotiating: 'Negociando',
  booked: 'Reservado',
  completed: 'Completado',
  lost: 'Perdido',
  tentative: 'Tentativa',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  paid: 'Pagado',
  deposit_paid: 'Depósito pagado',
  outstanding: 'Pendiente',

  // Leads
  New: 'Nuevo',
  Contacted: 'Contactado',
  Qualified: 'Calificado',
  'Quote sent': 'Cotización enviada',
  Negotiating: 'Negociando',
  Booked: 'Reservado',
  Completed: 'Completado',
  Lost: 'Perdido',
  Empty: 'Vacío',
  'No active leads.': 'No hay leads activos.',
  'Booked / completed / lost': 'Reservados / completados / perdidos',
  Lead: 'Lead',
  'Lead not found.': 'Lead no encontrado.',
  'no date': 'sin fecha',
  Activity: 'Actividad',
  'No activity yet.': 'Sin actividad todavía.',
  'Add a note…': 'Agregar una nota…',
  Add: 'Agregar',
  'Convert to booking →': 'Convertir en reserva →',
  'Convert to booking': 'Convertir en reserva',
  'Start time': 'Hora de inicio',
  'Duration (hours)': 'Duración (horas)',
  Location: 'Ubicación',
  'Total ($)': 'Total ($)',
  'Create booking': 'Crear reserva',
  Contact: 'Contacto',
  guests: 'invitados',
  'Follow-up': 'Seguimiento',
  Quote: 'Cotización',
  Send: 'Enviar',
  '← Back to leads': '← Volver a leads',

  // Bookings
  total: 'en total',
  'No bookings yet.': 'Aún no hay reservas.',
  Customer: 'Cliente',
  Event: 'Evento',
  Date: 'Fecha',
  Total: 'Total',
  Status: 'Estado',
  Payment: 'Pago',
  'Booking not found.': 'Reserva no encontrada.',
  Booking: 'Reserva',
  Checklist: 'Lista de verificación',
  Before: 'Antes',
  'Event day': 'Día del evento',
  After: 'Después',
  'No payments recorded.': 'Sin pagos registrados.',
  Amount: 'Monto',
  Deposit: 'Depósito',
  Balance: 'Saldo',
  Other: 'Otro',
  Cash: 'Efectivo',
  Zelle: 'Zelle',
  Venmo: 'Venmo',
  Card: 'Tarjeta',
  Record: 'Registrar',
  Tentative: 'Tentativa',
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  Financials: 'Finanzas',
  'Deposit required': 'Depósito requerido',
  Paid: 'Pagado',
  Staff: 'Personal',
  Name: 'Nombre',
  Assign: 'Asignar',
  '← Back to bookings': '← Volver a reservas',

  // Payments
  Outstanding: 'Pendiente',
  'Deposit paid': 'Depósito pagado',
  'Paid in full': 'Pagado completo',
  'paid ': 'pagado ',
  'bal ': 'saldo ',

  // Customers
  'No customers yet.': 'Aún no hay clientes.',
  Phone: 'Teléfono',
  Events: 'Eventos',
  Revenue: 'Ingresos',
  repeat: 'recurrente',
  'Customer not found.': 'Cliente no encontrado.',
  'Event history': 'Historial de eventos',
  'Total revenue': 'Ingresos totales',
  'Last contact': 'Último contacto',
  Email: 'Correo',
  '← Back to customers': '← Volver a clientes',

  // Calendar
  'No bookings this month.': 'No hay reservas este mes.',

  // Settings
  Brand: 'Marca',
  'Public brand name': 'Nombre público de la marca',
  'Shown on the public site header/footer. Currently a working name, pending confirmation.':
    'Se muestra en el encabezado y pie del sitio público. Por ahora es un nombre provisional, pendiente de confirmar.',
  'Starting prices': 'Precios desde',
  'Leave blank to show "Cotización gratis / Free quote" on the public packages section instead of a price.':
    'Déjalo en blanco para mostrar "Cotización gratis / Free quote" en la sección de paquetes del sitio público en lugar de un precio.',
  'Deposit required at booking (%)': 'Depósito requerido al reservar (%)',
  'Reset demo data': 'Restablecer datos de prueba',
  'Restores the original seeded leads, bookings and payments. Cannot be undone.':
    'Restaura los leads, reservas y pagos originales. No se puede deshacer.',
  'Confirm reset': 'Confirmar restablecimiento',
  Cancel: 'Cancelar',

  // Login
  'Log in': 'Iniciar sesión',
  'Sign in to manage your business': 'Inicia sesión para administrar tu negocio',
  Password: 'Contraseña',
  'Incorrect email or password.': 'Correo o contraseña incorrectos.',
  '← Back to the site': '← Volver al sitio',

  // Checklist template
  'Confirm location': 'Confirmar ubicación',
  'Confirm access': 'Confirmar acceso',
  'Confirm power': 'Confirmar electricidad',
  'Confirm space': 'Confirmar espacio',
  'Confirm insurance requirements': 'Confirmar requisitos de seguro',
  'Confirm payment': 'Confirmar pago',
  'Assign staff': 'Asignar personal',
  'Equipment check': 'Revisión del equipo',
  'Load equipment': 'Cargar equipo',
  Transport: 'Transporte',
  Setup: 'Montaje',
  'Safety check': 'Revisión de seguridad',
  'Event operation': 'Operación del evento',
  Breakdown: 'Desmontaje',
  'Return equipment': 'Devolver equipo',
  'Payment complete': 'Pago completo',
  'Photos uploaded': 'Fotos subidas',
  'Review requested': 'Reseña solicitada',
  'Social content created': 'Contenido para redes creado',
  'Customer follow-up': 'Seguimiento al cliente',
}

const PRIORITY_PREFIXES: [string, string][] = [
  ['Follow up:', 'Seguimiento:'],
  ['No reply on quote:', 'Sin respuesta a la cotización:'],
  ['Confirm:', 'Confirmar:'],
  ['Balance due before event:', 'Saldo pendiente antes del evento:'],
  ['No staff assigned:', 'Sin personal asignado:'],
]

export function useOSLang(): OSLang {
  return useSyncExternalStore(subscribe, readLang, () => 'en' as OSLang)
}

/** Returns { lang, t, locale, eventType, priority } for the admin UI. */
export function useT() {
  const lang = useOSLang()
  const t = useCallback((text: string) => (lang === 'es' ? (ES[text] ?? text) : text), [lang])
  const locale = lang === 'es' ? 'es-US' : 'en-US'
  const eventType = useCallback(
    (key: EventTypeKey | string) => {
      const labels = (lang === 'es' ? es : en).wizard.eventTypeLabels as Record<string, string>
      return labels[key] ?? key.replace('_', ' ')
    },
    [lang],
  )
  // Dashboard priority labels are built in logic.ts as English sentences.
  const priority = useCallback(
    (label: string) => {
      if (lang !== 'es') return label
      for (const [from, to] of PRIORITY_PREFIXES) {
        if (label.startsWith(from)) return (to + label.slice(from.length)).replace(' on ', ' el ')
      }
      return label
    },
    [lang],
  )
  return { lang, t, locale, eventType, priority }
}
