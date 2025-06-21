// Simple session-based data management for secure storage
export class SessionStorage {
  private static readonly SESSION_KEY = 'trauma_response_session'
  private static readonly EXPIRY_HOURS = 24 // Data expires after 24 hours

  static saveSessionData(data: any): void {
    try {
      const sessionData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000)
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
      }
    } catch (error) {
      console.warn('Failed to save session data:', error)
    }
  }

  static getSessionData(): any | null {
    try {
      if (typeof window === 'undefined') return null
      
      const sessionData = sessionStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null
      
      const parsed = JSON.parse(sessionData)
      
      // Check if data has expired
      if (Date.now() > parsed.expiresAt) {
        this.clearSessionData()
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.warn('Failed to retrieve session data:', error)
      return null
    }
  }

  static clearSessionData(): void {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.SESSION_KEY)
      }
    } catch (error) {
      console.warn('Failed to clear session data:', error)
    }
  }

  static isSessionValid(): boolean {
    try {
      if (typeof window === 'undefined') return false
      
      const sessionData = sessionStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return false
      
      const parsed = JSON.parse(sessionData)
      return Date.now() <= parsed.expiresAt
    } catch (error) {
      return false
    }
  }
} 