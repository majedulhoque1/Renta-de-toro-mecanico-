import { createFileRoute } from '@tanstack/react-router'

import { en } from '../../i18n/en'
import { Home } from '../../pages/Home'

export const Route = createFileRoute('/en/')({
  head: () => ({ meta: [{ title: en.meta.title }, { name: 'description', content: en.meta.description }] }),
  component: Home,
})
