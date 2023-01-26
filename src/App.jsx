import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { StateProvider } from './context/StateContext'
import Home from './components/Home'
import Main from './components/Main'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <StateProvider>
        <Main/>
      </StateProvider>
    </AuthProvider>
  )
}

export default App
