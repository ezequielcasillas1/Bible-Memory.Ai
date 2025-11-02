import React, { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const redirectTo = (search: string) => {
  const url = `${window.location.origin}/${search}`.replace(/\/+/g, '/').replace(':/', '://')
  window.location.replace(url)
}

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          redirectTo('?error=auth_failed')
          return
        }

        if (data.session) {
          redirectTo('?success=auth_success')
        } else {
          redirectTo('?error=no_session')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        redirectTo('?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  )
}

export default AuthCallback