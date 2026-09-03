import { useEffect, useState } from "react";
import { type User, fetchUsers } from "./services/api";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p style={{ marginTop: "1rem" }}>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <div className="card data-section">
        <h2>Team Members</h2>
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default App;
