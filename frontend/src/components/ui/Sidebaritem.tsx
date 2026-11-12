type inpt={
    text:string
}
export function SideItems({text}:inpt){
    return <div className="w-full bg-white hover:bg-slate-100 rounded-2xl py-2.5 ">
        <div className="font-light"> {text}</div>
           
    </div>
}