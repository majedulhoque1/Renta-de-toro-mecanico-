import type { Lang } from '../lib/lang'
import { en } from './en'
import { es } from './es'
import type { Dict } from './types'

export type { Dict } from './types'

export function getDict(lang: Lang): Dict {
  return lang === 'en' ? en : es
}
