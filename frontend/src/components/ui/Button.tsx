import { cva, type VariantProps }  from "class-variance-authority"
import type { ReactElement ,ComponentProps} from "react"
import { cn } from "../../lib/utils";

const buttonvariants=cva("rounded-md flex justify-center items-center",{
    variants:{
        variant:{
            primary:"bg-blued text-white",
            secondary:"bg-bluel text-blued",
        },
        size:{
            lg:"h-10 px-6",
            md:"h-8 px-2",
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
export const Button=({ variant, size, startIcon, className, children,onclick,endIcon,...props }: ButtonProps)=>{
    return <button className={cn(buttonvariants({ variant, size }), className)} {...props} onClick={onclick}>
      {startIcon}
      <div className="pr-1 pl-1">
        {children}
      </div>
      
      {endIcon}
    </button>}
