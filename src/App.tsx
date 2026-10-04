import { useState, useCallback } from "react";
import { Hero } from "./components/Hero";
import { Loader } from "./components/Loader";
import { ThemeProvider } from "./components/theme-provider";

export function App() {
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setIsLoaderComplete(true);
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <main>
        <Loader onComplete={handleLoaderComplete} />
        <Hero isLoaderComplete={isLoaderComplete} />
      </main>
    </ThemeProvider>
  );
}

export default App;
