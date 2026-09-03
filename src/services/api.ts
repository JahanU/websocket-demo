export interface User {
  id: number;
  name: string;
  role: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    { id: 1, name: "Alice Johnson", role: "Frontend Engineer" },
    { id: 2, name: "Bob Smith", role: "Backend Engineer" },
    { id: 3, name: "Charlie Brown", role: "Product Designer" },
  ];
};
