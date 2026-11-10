import { ShareIcon as HeroShareIcon } from "@heroicons/react/24/outline";
import { cn } from "../lib/utils";
import { iconVariants, type IconProps } from "./iconVariants";

export const ShareIcon = ({ size, className }: IconProps) => {
  return <HeroShareIcon className={cn(iconVariants({ size }), className)} />;
};
