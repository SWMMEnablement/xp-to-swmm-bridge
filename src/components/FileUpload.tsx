import { Upload, File, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

export const FileUpload = ({ onFileSelect, selectedFile, onClearFile }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xp')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Upload XPSWMM File</h2>
          <p className="text-sm text-muted-foreground">Select your .xp file to begin conversion</p>
        </div>

        {!selectedFile ? (
          <div
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium text-foreground mb-2">
              Drag and drop your .xp file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".xp"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium cursor-pointer hover:bg-primary/90 transition-colors">
                Browse Files
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-4">Maximum file size: 100MB</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={onClearFile}
                className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-destructive" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
