import { Crossicon } from "../../icons/Crossicon";

export function ContentModal({open,onclose}){
    return <div>
        {open && <div className="w-screen h-screen bg-slate-500 opacity-60 fixed top-0 left-0 flex justify-center">
            <div className="flex flex-col justify-center">
                <span className="bg-white opacity-100 p-4 rounded">
                    <div className="flex justify-end">
                        <div onClick={onclose} className="cursor-pointer">
                            <Crossicon/>
                        </div>
                        
                    </div>
                    <div>
                        <Input placeholder={"title"}/>
                    </div>
                </span>
            </div>
            </div>}
    </div>
}
function Input({placeholder}){
    return <input type="text" placeholder="" />

   
}