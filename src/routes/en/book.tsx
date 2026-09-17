import { createFileRoute } from '@tanstack/react-router'

import { en } from '../../i18n/en'
import { Book } from '../../pages/Book'

export const Route = createFileRoute('/en/book')({
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: typeof search.tipo === 'string' ? search.tipo : undefined,
  }),
  head: () => ({ meta: [{ title: `${en.wizard.title} — ${en.meta.title}` }] }),
  component: Book,
})
