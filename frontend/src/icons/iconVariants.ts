import { cva, type VariantProps } from "class-variance-authority";

export const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type IconProps = VariantProps<typeof iconVariants> & {
  className?: string;
};
