import { BrainIcon } from "../../icons/Brain";
import { SideItems } from "./Sidebaritem";

export function SideBar(){
    return <div className="h-screen bg-white border-r w-72
     fixed left-0 top-0">
        <div className="flex"> 
            <BrainIcon className="text-blued "/>
            <div className="pl-4 text-center pt-2 font-medium text-2xl text-blued">
                 Second Brain
            </div>
           
       </div>
        <div className="flex flex-col pt-10 text-center">
                <SideItems text={"youttube"}/>
                <SideItems text={"twitter"}/>
                <SideItems text={"images"}/>
            </div>

      
    </div>
}