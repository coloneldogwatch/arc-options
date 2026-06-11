import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  flush?: boolean;
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ flush, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border/10 rounded-lg",
        flush ? "overflow-hidden" : "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = "Card";
export default Card;

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center mb-3">
      <span className="font-display font-medium text-[15px]">{title}</span>
      {action && <span className="ml-auto text-[12.5px] text-accent cursor-pointer">{action}</span>}
    </div>
  );
}
