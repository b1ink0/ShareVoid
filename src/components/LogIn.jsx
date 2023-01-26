import React from 'react'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../assets/GoogleIcon'

export default function Login() {
  const { logIn } = useAuth()
  return (
      <>
        <nav className="w-full h-7 bg-[color:var(--bg-secondary)] absolute top-0">
          <h1 className="w-full h-7 text-center">
            ShareVoid
          </h1>
        </nav>
        <button onClick={logIn} className="bg-[color:var(--bg-secondary)] pt-1 pb-1 pr-4 pl-4 flex justify-center items-center rounded-full">
          <span>Log In Using</span>
          <div className="w-4 ml-2">
            <GoogleIcon size={4} />
          </div>
        </button>
      </>
  )
}
