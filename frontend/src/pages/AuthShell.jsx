import { motion } from "framer-motion";

const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-0 glow" />
    <div className="relative mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/[0.03] sm:p-8 dark:shadow-black/30"
      >
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </motion.div>
      {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
    </div>
  </div>
);

export default AuthShell;
