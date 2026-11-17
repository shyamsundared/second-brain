import { XCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "../lib/utils";
import { iconVariants, type IconProps } from "./iconVariants";

export const Crossicon = ({ size, className }: IconProps) => {
  return <XCircleIcon className={cn(iconVariants({ size }), className)} />;
};
