import { useCallback, useState } from "react"
import Dashboard from "./pages/Dashboard"
import { Signin } from "./pages/Signin"
import { Signup } from "./pages/Signup"
import { SharedBrain } from "./pages/SharedBrain"

// /share/<hash> is a public page, everything else needs a login
const shareHash = window.location.pathname.match(/^\/share\/([a-f0-9]+)$/)?.[1]

function App() {
  // Signed in = we have a token saved from a previous sign in
  const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem("token"))
  const [authPage, setAuthPage] = useState<"signin" | "signup">("signin")

  // useCallback keeps the same function between renders, so Dashboard's effects don't re-run
  const signout = useCallback(() => {
    localStorage.removeItem("token")
    setSignedIn(false)
  }, [])

  if (shareHash) return <SharedBrain hash={shareHash} />

  if (!signedIn) {
    return authPage === "signin"
      ? <Signin onSignin={() => setSignedIn(true)} onSwitch={() => setAuthPage("signup")} />
      : <Signup onSignin={() => setSignedIn(true)} onSwitch={() => setAuthPage("signin")} />
  }
  return <Dashboard onSignout={signout} />
}

export default App
