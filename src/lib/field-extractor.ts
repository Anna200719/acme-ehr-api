const ARRAY_INDEX_PATTERN = /\[(\d+)\]/g

const pathToParts = (path: string): string[] =>
  path.replace(ARRAY_INDEX_PATTERN, '.$1').split('.').filter(Boolean)

export const getNestedValue = (obj: Record<string, unknown>, path: string): unknown =>
  pathToParts(path).reduce<unknown>((current, part) => {
    if (current == null || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[part]
  }, obj)

export const extractFields = (
  resource: Record<string, unknown>,
  fields: readonly string[]
): Record<string, unknown> =>
  Object.fromEntries(fields.map(field => [field, getNestedValue(resource, field)]))