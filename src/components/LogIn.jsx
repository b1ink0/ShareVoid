import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useStateContext } from '../context/StateContext'

export default function LogIn() {
    const { logIn, currentUser, logOut}  = useAuth()
    const {loggedIn, setLoggedIn} = useStateContext()
    console.log(loggedIn)
  return (
    <>
        <button onClick={logIn}>Login</button>
        <button onClick={logOut}>LogOut</button>
        <button onClick={() => console.log(currentUser)}>Check</button>
        <img src={currentUser.photoURL}/>
    </>
  )
}
