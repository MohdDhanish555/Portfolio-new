import { Moon, Sun } from "lucide-react";

export function ModeToggle({ onToggle }: { onToggle?: () => void }) {
  const toggleTheme = () => {
    onToggle?.();
  };

  return (
    <button
      onClick={toggleTheme}
      className="bg-transparent hover:opacity-80 border-0 p-0 h-full w-full flex items-center justify-center relative cursor-pointer"
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
        <Sun className="w-4 h-4 md:w-5 md:h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-background absolute" />
        <Moon className="w-4 h-4 md:w-5 md:h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-background absolute" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
