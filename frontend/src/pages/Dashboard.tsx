import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'

import { PlusIcon } from '../icons/plusicon'
import { ShareIcon } from '../icons/shareicon'
import { Card } from '../components/ui/Card'
import { ContentModal } from '../components/ui/ContentModal'
import { SideBar, type Filter } from '../components/ui/Sidebar'
import { SearchBar } from '../components/ui/SearchBar'
import { api, kindOf, type Content } from '../lib/content'

export function Dashboard({ onSignout }: { onSignout: () => void }) {
  const [modalOpen,setmodalopen]=useState(false);
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<Content[] | null>(null); // null = still searching
  const [contents,setContents]=useState<Content[] | null>(null); // null = still loading
  const [reloadKey,setReloadKey]=useState(0); // bump this to fetch the list again
  const [filter,setFilter]=useState<Filter>("all");
  // "Show similar" view: which item, and what was found (null = still loading)
  const [similar,setSimilar]=useState<{ title: string; items: Content[] | null } | null>(null);
  const [shareHash,setShareHash]=useState<string | null>(null);
  const [copied,setCopied]=useState(false);

  // Used by the search bar and by clicking a tag on a card
  function searchFor(text: string){
    setSimilar(null);
    setQuery(text);
    setResults(null);
  }

  // Load the user's saved content when the dashboard opens, and again after adding/deleting
  useEffect(()=>{
    let ignore=false;
    api("/api/v1/content").then(async (res)=>{
      if(res.status===401) return onSignout();
      const data=res.ok ? await res.json() : {data:[]};
      if(!ignore) setContents(data.data);
    });
    return ()=>{ ignore=true; };
  },[reloadKey, onSignout]);

  // Is the brain already shared? Show the link if so.
  useEffect(()=>{
    api("/api/v1/brain/share").then(async (res)=>{
      if(res.ok) setShareHash((await res.json()).hash);
    });
  },[]);

  // Wait until the user stops typing for 300ms, then search
  useEffect(()=>{
    const q=query.trim();
    if(!q) return;
    let ignore=false;
    const timer=setTimeout(async ()=>{
      const res=await api(`/api/v1/search?q=${encodeURIComponent(q)}`);
      if(res.status===401) return onSignout(); // token is invalid or expired, send user back to signin
      const data=res.ok ? await res.json() : {results:[]};
      if(!ignore) setResults(data.results);
    },300);
    return ()=>{ ignore=true; clearTimeout(timer); };
  },[query, onSignout]);

  async function deleteContent(c: Content){
    if(!confirm(`Delete "${c.title}"?`)) return;
    const res=await api(`/api/v1/content/${c.id}`,{ method:"DELETE" });
    if(res.status===401) return onSignout();
    // Remove it from whatever list is showing, then refresh the full list
    setResults(r=>r && r.filter(x=>x.id!==c.id));
    setSimilar(s=>s && { ...s, items: s.items && s.items.filter(x=>x.id!==c.id) });
    setReloadKey(k=>k+1);
  }

  async function showSimilar(c: Content){
    setSimilar({ title:c.title, items:null });
    const res=await api(`/api/v1/content/${c.id}/related`);
    if(res.status===401) return onSignout();
    const data=res.ok ? await res.json() : {results:[]};
    setSimilar({ title:c.title, items:data.results });
  }

  async function setSharing(share: boolean){
    const res=await api("/api/v1/brain/share",{ method:"POST", body:JSON.stringify({ share }) });
    if(res.status===401) return onSignout();
    if(res.ok) setShareHash((await res.json()).hash);
  }

  const shareUrl=shareHash ? `${window.location.origin}/share/${shareHash}` : "";
  async function copyShareUrl(){
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  }

  // Pick what to show: similar items, search results, or everything
  const list=similar ? similar.items : query.trim() ? results : contents;
  const visible=list?.filter(c=>filter==="all" || kindOf(c.link)===filter);
  const loadingText=similar ? "Finding similar items..." : query.trim() ? "Searching..." : "Loading...";
  const emptyText=
    list && list.length > 0 ? "Nothing in this category." :
    similar ? `Nothing similar to "${similar.title}" yet.` :
    query.trim() ? `No results for "${query}"` :
    `Nothing saved yet. Click "Add Content" to save your first link.`;

  return (
    <>
    <SideBar filter={filter} onFilter={setFilter}/>
    <ContentModal open={modalOpen} onclose={()=>setmodalopen(false)} onAdded={()=>setReloadKey(k=>k+1)}/>

    <div className='ml-72 px-4 pt-3 flex justify-between items-center gap-4'>
      <SearchBar value={query} onChange={searchFor}/>
      <div className='flex items-center gap-2'>
        <Button variant={"primary"} size={'md'} onclick={()=>{setmodalopen(true)}} startIcon={<PlusIcon size={'sm'}/>}>Add Content</Button>
        {!shareHash && (
          <Button variant={"secondary"} size={'md'} onclick={()=>setSharing(true)} startIcon={<ShareIcon size={'sm'}/>}>Share brain</Button>
        )}
        <Button variant={"secondary"} size={'md'} onclick={onSignout}>Log out</Button>
      </div>
    </div>

    {shareHash && (
      <div className='ml-72 mx-4 mt-3 px-4 py-2 rounded-md bg-bluel text-sm flex flex-wrap items-center gap-3'>
        <span>Your brain is public:</span>
        <a href={shareUrl} target="_blank" rel="noreferrer" className='text-blued underline break-all'>{shareUrl}</a>
        <button type="button" onClick={copyShareUrl} className='text-blued font-medium'>{copied ? "Copied!" : "Copy"}</button>
        <button type="button" onClick={()=>setSharing(false)} className='text-red-600 font-medium'>Stop sharing</button>
      </div>
    )}

    {similar && (
      <div className='ml-72 px-4 pt-4 text-sm flex items-center gap-3'>
        <button type="button" onClick={()=>setSimilar(null)} className='text-blued font-medium'>← Back</button>
        <span>Similar to <b>{similar.title}</b></span>
      </div>
    )}

    <div className='ml-72 px-4 pt-4 pb-8 flex flex-wrap items-start gap-4'>
      {visible===undefined ? (
        <p className='text-gray-500 text-sm'>{loadingText}</p>
      ) : visible.length ? (
        visible.map(c=>(
          <Card key={c.id} title={c.title} link={c.link} tags={c.tags} onTagClick={searchFor}
            onDelete={()=>deleteContent(c)} onSimilar={()=>showSimilar(c)}/>
        ))
      ) : (
        <p className='text-gray-500 text-sm'>{emptyText}</p>
      )}
    </div>
    </>
  )
}

export default Dashboard
