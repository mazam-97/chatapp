import { useState, useRef } from "react";

// Default to same-origin paths (routed by the k8s Ingress to backend/websocket).
// For local dev, the Docker image is built with VITE_* build args pointing at localhost.
const wsScheme = location.protocol === "https:" ? "wss" : "ws";
const BACKEND = import.meta.env.VITE_BACKEND_URL || `${location.origin}/api`;
const WS = import.meta.env.VITE_WS_URL || `${wsScheme}://${location.host}/ws`;

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const ws = useRef(null);

  const auth = async (path) => {
    const res = await fetch(`${BACKEND}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    data.token ? setToken(data.token) : alert(data.error);
  };

  const join = () => {
    ws.current = new WebSocket(`${WS}?token=${token}`);
    ws.current.onopen = () => ws.current.send(JSON.stringify({ type: "join", room }));
    ws.current.onmessage = (e) => setMessages((m) => [...m, JSON.parse(e.data)]);
    setJoined(true);
  };

  const send = () => {
    ws.current.send(JSON.stringify({ type: "message", text }));
    setText("");
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 480, margin: "40px auto" }}>
      <h1>Chat App</h1>

      {!token && (
        <div>
          <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={() => auth("signup")}>Sign up</button>
          <button onClick={() => auth("signin")}>Sign in</button>
        </div>
      )}

      {token && !joined && (
        <div>
          <input placeholder="room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <button onClick={join}>Join room</button>
        </div>
      )}

      {joined && (
        <div>
          <h3>Room: {room}</h3>
          <div style={{ border: "1px solid #ccc", height: 240, overflowY: "auto", padding: 8 }}>
            {messages.map((m, i) => (
              <div key={i}><b>{m.user}:</b> {m.text}</div>
            ))}
          </div>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={send}>Send</button>
        </div>
      )}
    </div>
  );
}
