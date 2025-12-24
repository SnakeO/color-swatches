export interface Notification {
  show: boolean
  message: string
  color: string
}

export type LimiterFunction = <T>(fn: () => Promise<T>) => Promise<T>
