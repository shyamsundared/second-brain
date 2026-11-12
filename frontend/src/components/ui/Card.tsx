import { ShareIcon } from "../../icons/shareicon";

export function Card(){
    return <div>
        <div className="bg-white max-w-72 shadow-md border border-gray-200 h-40 rounded-md">
            <div className="flex justify-between">
                <div className="flex items-center text-sm"> 
                 <div className="pr-2 text-gray-500">
                   <ShareIcon/>
                   </div>
                   project ideas
                </div>
               <div className="flex items-center">
                <div className="pr-2 text-gray-500">
                   <ShareIcon/>
                   </div>
               <div className="pr-2 text-gray-500">
                   <ShareIcon/>
                   </div>
                
            </div>
             
            </div>
            
        </div>
    </div>
}