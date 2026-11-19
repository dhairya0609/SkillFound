import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
  const { resolvedTheme = "light" } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      className="toaster group"
      toastOptions={{ classNames: { toast: "!rounded-xl !font-sans" } }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
};

export { Toaster };
