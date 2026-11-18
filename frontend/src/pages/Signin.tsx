import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/ContentModal";

export function Signin({ onSignin, onSwitch }: { onSignin: () => void; onSwitch: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Sign in failed");
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
        <h1 className="text-xl font-semibold">Sign in</h1>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={loading} className="disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-sm text-gray-600 text-center">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitch} className="text-blued font-medium">Sign up</button>
        </p>
      </form>
    </div>
  );
}
