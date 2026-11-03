import dayjs from 'dayjs'

export function formatDate(value: Date | string | number, format: string): string {
  return dayjs(value).format(format)
}
