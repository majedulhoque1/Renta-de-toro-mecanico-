import { createFileRoute } from '@tanstack/react-router'

import { es } from '../i18n/es'
import { Home } from '../pages/Home'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: es.meta.title }, { name: 'description', content: es.meta.description }] }),
  component: Home,
})
