import React from 'react'
import { useAuth } from '../context/AuthContext'
import LogIn from './Login'
import Main from './Main'


export default function Home() {
    const { currentUser} = useAuth()
  return (
    
     currentUser ? <Main/> : <LogIn/>
    
  )
}
