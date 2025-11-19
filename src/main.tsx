import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("MAIN.TSX IS LOADING!!!");

const root = document.getElementById("root");
console.log("ROOT ELEMENT:", root);

if (root) {
  createRoot(root).render(<App />);
  console.log("REACT APP RENDERED!");
} else {
  console.error("ROOT ELEMENT NOT FOUND!");
}
