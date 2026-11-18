import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { BrainIcon } from "../../icons/Brain";
import { VideoIcon } from "../../icons/VideoIcon";
import { TweetIcon } from "../../icons/TweetIcon";
import { DocumentLink } from "../../icons/DocumentIcon";
import type { Kind } from "../../lib/content";
import { SideItems } from "./Sidebaritem";

export type Filter = Kind | "all"

export function SideBar({filter,onFilter}:{filter:Filter; onFilter:(f:Filter)=>void}){
    return <div className="h-screen bg-white border-r border-gray-200 w-72 fixed left-0 top-0 px-3">
        <div className="flex items-center pt-2">
            <BrainIcon className="text-blued"/>
            <div className="pl-4 font-medium text-2xl text-blued">
                 Second Brain
            </div>
        </div>
        <div className="flex flex-col gap-1 pt-10">
            <SideItems text="All" icon={<Squares2X2Icon className="size-5"/>} active={filter==="all"} onClick={()=>onFilter("all")}/>
            <SideItems text="Videos" icon={<VideoIcon/>} active={filter==="youtube"} onClick={()=>onFilter("youtube")}/>
            <SideItems text="Tweets" icon={<TweetIcon/>} active={filter==="twitter"} onClick={()=>onFilter("twitter")}/>
            <SideItems text="Articles" icon={<DocumentLink/>} active={filter==="article"} onClick={()=>onFilter("article")}/>
        </div>
    </div>
}
