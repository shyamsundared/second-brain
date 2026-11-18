import type { ReactNode } from "react"

interface SideItemProps {
    text: string
    icon: ReactNode
    active: boolean
    onClick: () => void
}

export function SideItems({text,icon,active,onClick}:SideItemProps){
    return <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-6 py-2.5 rounded-2xl text-left ${active ? "bg-bluel text-blued font-medium" : "hover:bg-slate-100 text-gray-700"}`}
    >
        <span className="w-5 flex justify-center">{icon}</span>
        {text}
    </button>
}
