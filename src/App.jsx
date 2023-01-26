import { AuthProvider } from './context/AuthContext'
import { StateProvider } from './context/StateContext'
import Main from './components/Main'

function App() {
  return (
    <AuthProvider>
      <StateProvider>
        <Main/>
      </StateProvider>
    </AuthProvider>
  )
}

export default App
