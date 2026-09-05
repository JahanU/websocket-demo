# React WebSocket + SSE Demo

An interactive demo showcasing real-time communication patterns in React using **WebSockets** and **Server-Sent Events (SSE)**.

> 🛠️ **Template Base:** Built on top of the [React-Bun-Vite-template](https://github.com/JahanU/React-Bun-Vite-template) starter.

---

## 🚀 Quick Start

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Running the App

1. **Install dependencies**
   bun install

2. **Start the backend server**
   bun run dev:server

3. **Start the React app** (in a separate terminal)
   bun run dev

---

## 🔀 Exploring Features

This repository uses dedicated feature branches to walk through each real-time implementation:

| Branch | Description | Protocol |
| :--- | :--- | :--- |
| [`feature/web-socket`](../../tree/feature/web-socket) | Full-duplex, bi-directional real-time communication | WebSocket |
| [`feature/SSE`](../../tree/feature/SSE) | Light-weight, server-to-client unidirectional streaming | Server-Sent Events |

### How to Switch Branches

* git checkout feature/web-socket
* git checkout feature/SSE

---

## 🧰 Tech Stack

* **Frontend:** React, Vite
* **Runtime & Package Manager:** Bun
* **Real-Time Protocols:** WebSockets, Server-Sent Events (SSE)
