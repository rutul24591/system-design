import { BrowserRouter, Route, Routes } from "react-router-dom";

import Body from "./components/Body";
import Accordion from "./components/Accordion/Accordion";

function App() {
  return (
    <div>
      <header className="flex text-3xl text-center font-bold w-100 py-5 bg-gray-200 align-center">
        <h2 className="w-200 m-2 text-3xl">
          System Design
        </h2>
        <nav className="px-20 m-2 w-[1200px] flex justify-between align-center text-lg">
          <a href="/" className="mt-1">Home</a>
          <a href="/live-chat" className="mt-1">Live Chat</a>
          <a href="/accordion" className="mt-1">Accordion</a>
          <a href="/shimmer" className="mt-1">Shimmer UI</a>
          <a href="/slider" className="mt-1">Image slider</a>
          <a href="/nested-comments" className="mt-1">Nested Comments</a>
          <a href="/pagination" className="mt-1">Pagination</a>
          <a href="/team" className="mt-1">Team</a>
          <a href="/search" className="mt-1">Search</a>
          <a href="/login" className="mt-1">Login</a>
        </nav>
      </header>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Body />} />
          <Route path="/accordion" element={<Accordion />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
