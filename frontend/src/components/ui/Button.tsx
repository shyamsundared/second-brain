import { cva, type VariantProps }  from "class-variance-authority"
import type { ReactElement ,ComponentProps} from "react"
import { cn } from "../../lib/utils";

const buttonvariants=cva("rounded-md ",{
    variants:{
        variant:{
            primary:"bg-blued text-white",
            secondary:"bg-bluel text-blued",
        },
        size:{
            lg:"h-10 px-8",
            md:"h-8 px-4",
            sm:"h-4 py-2",
        },
    },
    defaultVariants:{
        variant:"primary",
        size:"md"
    }
})
type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonvariants> & {
    startIcon?: ReactElement;
    endIcon?:ReactElement
    onclick:()=>void
  };
export const Button=({ variant, size, startIcon, className, children,onclick, ...props }: ButtonProps)=>{
    return <button className={cn(buttonvariants({ variant, size }), className)} {...props} onClick={onclick}>
      {startIcon}
      {children}
    </button>}
