import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type Mode = 'sign-in' | 'sign-up' | 'forgot-password'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { status, signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/chat" replace />
  }

  async function handleGoogleSignIn() {
    setError(null)
    setMessage(null)
    setGoogleLoading(true)
    const result = await signInWithGoogle()
    setGoogleLoading(false)
    if (result.error) {
      setError(result.error)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    if (mode === 'forgot-password') {
      const result = await resetPassword(email)
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Password reset instructions have been sent to your email.')
      }
      return
    }

    if (mode === 'sign-in') {
      const result = await signIn(email, password)
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
      }
      return
    }

    // Sign-up flow
    const result = await signUp(email, password)
    if (result.error) {
      setSubmitting(false)
      setError(result.error)
      return
    }

    const autoSignIn = await signIn(email, password)
    setSubmitting(false)
    if (autoSignIn.error) {
      setMessage('Account created! Please sign in with your password.')
      setMode('sign-in')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Document Copilot</CardTitle>
          <CardDescription>
            {mode === 'sign-in' && 'Sign in to access your investment research workspace.'}
            {mode === 'sign-up' && 'Create an account to start analyzing filings.'}
            {mode === 'forgot-password' && 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google Auth Button (shown on sign-in and sign-up) */}
          {mode !== 'forgot-password' && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center font-medium"
                disabled={googleLoading || submitting}
                onClick={handleGoogleSignIn}
              >
                <GoogleIcon />
                {googleLoading ? 'Connecting to Google...' : mode === 'sign-in' ? 'Sign in with Google' : 'Sign up with Google'}
              </Button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-border w-full" />
                <span className="bg-card px-2 text-xs uppercase text-muted-foreground font-semibold">
                  Or continue with email
                </span>
                <div className="border-t border-border w-full" />
              </div>
            </>
          )}

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="analyst@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setMode('forgot-password')
                        setError(null)
                        setMessage(null)
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            )}

            {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
            {message && <p className="text-xs text-primary bg-primary/10 p-2 rounded">{message}</p>}

            <Button type="submit" className="w-full" disabled={submitting || status === 'loading'}>
              {submitting
                ? 'Please wait…'
                : mode === 'sign-in'
                  ? 'Sign in with Email'
                  : mode === 'sign-up'
                    ? 'Create Account'
                    : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 justify-center text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
          {mode === 'sign-in' && (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode('sign-up')
                  setError(null)
                  setMessage(null)
                }}
              >
                Sign up
              </button>
            </p>
          )}

          {mode === 'sign-up' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode('sign-in')
                  setError(null)
                  setMessage(null)
                }}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot-password' && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode('sign-in')
                  setError(null)
                  setMessage(null)
                }}
              >
                Back to Sign in
              </button>
            </p>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
