import { useCallback, useState } from "react"
import Dashboard from "./pages/Dashboard"
import { Signin } from "./pages/Signin"

function App() {
  // Signed in = we have a token saved from a previous sign in
  const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem("token"))

  // useCallback keeps the same function between renders, so Dashboard's effect doesn't re-run
  const signout = useCallback(() => {
    localStorage.removeItem("token")
    setSignedIn(false)
  }, [])

  if (!signedIn) return <Signin onSignin={() => setSignedIn(true)} />
  return <Dashboard onSignout={signout} />
}

export default App
