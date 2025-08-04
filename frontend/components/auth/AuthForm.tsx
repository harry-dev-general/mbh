'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface AuthFormProps {
  redirectTo?: string
}

export default function AuthForm({ redirectTo = '/dashboard' }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
          }
        })

        if (error) throw error
        
        setMessage({
          type: 'success',
          text: 'Check your email for the confirmation link!'
        })
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        // Redirect on successful login
        window.location.href = redirectTo
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred during authentication'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage(null)
              }}
              className="link-button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .auth-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }

        h2 {
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #0066cc;
        }

        input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        button[type="submit"] {
          width: 100%;
          padding: 0.75rem;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        button[type="submit"]:hover:not(:disabled) {
          background-color: #0052a3;
        }

        button[type="submit"]:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .message {
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .message.error {
          background-color: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .message.success {
          background-color: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .auth-switch {
          margin-top: 1.5rem;
          text-align: center;
          color: #666;
        }

        .link-button {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          text-decoration: underline;
          margin-left: 0.5rem;
          font-size: inherit;
        }

        .link-button:hover {
          color: #0052a3;
        }
      `}</style>
    </div>
  )
} 