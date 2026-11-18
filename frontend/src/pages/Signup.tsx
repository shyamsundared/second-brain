import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/ContentModal";

function post(url: string, body: object) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function Signup({ onSignin, onSwitch }: { onSignin: () => void; onSwitch: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await post("/api/v1/signup", { username, password });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Sign up failed");
        return;
      }
      // Account created: sign in right away so the user doesn't type it all again
      const signin = await post("/api/v1/signin", { username, password });
      const data = await signin.json();
      if (!signin.ok) {
        onSwitch(); // account exists, let them sign in manually
        return;
      }
      localStorage.setItem("token", data.token);
      onSignin();
    } catch {
      setError("Can't reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen h-screen bg-gray-100 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md border border-gray-200 p-8 w-80 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={30} autoFocus />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={loading} className="disabled:opacity-60">
          {loading ? "Creating account..." : "Sign up"}
        </Button>
        <p className="text-sm text-gray-600 text-center">
          Already have an account?{" "}
          <button type="button" onClick={onSwitch} className="text-blued font-medium">Sign in</button>
        </p>
      </form>
    </div>
  );
}
