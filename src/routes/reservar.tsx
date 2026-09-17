import { createFileRoute } from '@tanstack/react-router'

import { es } from '../i18n/es'
import { Book } from '../pages/Book'

export const Route = createFileRoute('/reservar')({
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: typeof search.tipo === 'string' ? search.tipo : undefined,
  }),
  head: () => ({ meta: [{ title: `${es.wizard.title} — ${es.meta.title}` }] }),
  component: Book,
})
