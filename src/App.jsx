import { AuthProvider } from './context/AuthContext'
import { StateProvider } from './context/StateContext'
import Main from './components/Main'
import Home from './components/Home'

function App() {
  return (
    <AuthProvider>
      <StateProvider>
        <Home/>
      </StateProvider>
    </AuthProvider>
  )
}

export default App
