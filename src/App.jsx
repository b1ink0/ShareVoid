import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { StateProvider } from './context/StateContext'
import Home from './components/Home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <StateProvider>
        <Home/>
      </StateProvider>
    </AuthProvider>
  )
}

export default App
