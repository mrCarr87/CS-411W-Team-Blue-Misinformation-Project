export const theme = {
  accent: "from-sky-500 to-indigo-500",
  accentSoft: "from-sky-50 to-indigo-50",
  ring: "focus-within:ring-2 focus-within:ring-sky-200",
  button: "bg-sky-600 hover:bg-sky-700",
  buttonPrimary: "bg-slate-900 hover:bg-slate-800 text-white",
  buttonSecondary: "text-slate-700 hover:bg-slate-100",
};

export function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(mode) {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}