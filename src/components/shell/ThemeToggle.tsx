import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/store/appState";

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const theme = useAppState((s) => s.theme);
  const setTheme = useAppState((s) => s.setTheme);

  return (
    <div className="inline-flex rounded-lg border p-0.5 gap-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          size="sm"
          variant={theme === value ? "default" : "ghost"}
          className="h-7 gap-1.5 text-xs"
          onClick={() => setTheme(value)}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
