import { FileCode, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('xp-theme') === 'dark' ||
             (!localStorage.getItem('xp-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('xp-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('xp-theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <FileCode className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">XPSWMM to SWMM5 Converter</h1>
              <p className="text-sm text-muted-foreground">Convert your models with ease</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link 
              to="/reader" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Card Reader
            </Link>
            <Link 
              to="/docs" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
