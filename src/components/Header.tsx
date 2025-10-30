import { FileCode } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
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
          <nav>
            <Link 
              to="/docs" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
