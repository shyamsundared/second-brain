import { useState, type ComponentProps, type FormEvent } from "react";
import { Crossicon } from "../../icons/Crossicon";
import { Button } from "./Button";
import { api, kindOf } from "../../lib/content";

interface ContentModalProps {
    open: boolean
    onclose: () => void
    onAdded: () => void
}

// The backend's content types. Twitter has no type of its own yet, so tweets are saved as "article".
function typeFromLink(link: string) {
    return kindOf(link) === "youtube" ? "video" : "article"
}

export function ContentModal({open,onclose,onAdded}: ContentModalProps){
    const [link,setLink]=useState("");
    const [title,setTitle]=useState("");
    const [tags,setTags]=useState(""); // comma separated, e.g. "react, habits"
    const [error,setError]=useState("");
    const [saving,setSaving]=useState(false);

    async function handleSubmit(e: FormEvent){
        e.preventDefault();
        setError("");
        setSaving(true);
        try{
            const res=await api("/api/v1/content",{
                method:"POST",
                body: JSON.stringify({ link, title, type: typeFromLink(link), tags: tags.split(",") }),
            });
            if(!res.ok){
                const data=await res.json();
                setError(data.message ?? "Could not save");
                return;
            }
            setLink("");
            setTitle("");
            setTags("");
            onAdded();
            onclose();
        }catch{
            setError("Can't reach the server");
        }finally{
            setSaving(false);
        }
    }

    if(!open) return null;

    return <div className="w-screen h-screen bg-slate-500/60 fixed top-0 left-0 flex justify-center items-center z-10">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md w-96 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="font-semibold">Add content</h2>
                <button type="button" onClick={onclose} className="cursor-pointer text-gray-500">
                    <Crossicon/>
                </button>
            </div>
            <Input type="url" placeholder="Link (YouTube, tweet, article...)" value={link} onChange={(e)=>setLink(e.target.value)} required autoFocus/>
            <Input placeholder="Title (optional, filled in for tweets and videos)" value={title} onChange={(e)=>setTitle(e.target.value)}/>
            <Input placeholder="Tags, comma separated (e.g. react, habits)" value={tags} onChange={(e)=>setTags(e.target.value)}/>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" variant="primary" size="lg" disabled={saving} className="disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
            </Button>
        </form>
    </div>
}

// Accepts any <input> prop (value, onChange, type, ...)
export function Input(props: ComponentProps<"input">){
    return <input type="text" className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blued" {...props} />
}
