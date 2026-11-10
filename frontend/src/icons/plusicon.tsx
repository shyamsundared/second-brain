import { PlusIcon as HeroPlusIcon } from "@heroicons/react/24/outline";
import { cn } from "../lib/utils";
import { iconVariants, type IconProps } from "./iconVariants";

export const PlusIcon = ({ size, className }: IconProps) => {
  return <HeroPlusIcon className={cn(iconVariants({ size }), className)} />;
};
