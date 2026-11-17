import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'

import { PlusIcon } from '../icons/plusicon'
import { ShareIcon } from '../icons/shareicon'
import { Card } from '../components/ui/Card'
import { ContentModal } from '../components/ui/ContentModal'
import { SideBar } from '../components/ui/Sidebar'
import { SearchBar } from '../components/ui/SearchBar'

interface Content {
  id: number
  title: string
  link: string
}

// Card only knows youtube and twitter embeds for now
function cardType(link: string) {
  return link.includes("youtu") ? "youtube" : "twitter"
}

export function Dashboard({ onSignout }: { onSignout: () => void }) {
  const [modalOpen,setmodalopen]=useState(false);
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<Content[] | null>(null); // null = still searching

  // Wait until the user stops typing for 300ms, then search
  useEffect(()=>{
    const q=query.trim();
    if(!q) return;
    let ignore=false;
    const timer=setTimeout(async ()=>{
      const res=await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`,{
        headers:{ authorization: localStorage.getItem("token") ?? "" },
      });
      if(res.status===401) return onSignout(); // token is invalid, send user back to signin
      const data=res.ok ? await res.json() : {results:[]};
      if(!ignore) setResults(data.results);
    },300);
    return ()=>{ ignore=true; clearTimeout(timer); };
  },[query, onSignout]);

  return (
    <>
    <SideBar></SideBar>
    <ContentModal open={modalOpen} onclose={()=>setmodalopen(false)}>
    </ContentModal>

    <div className='ml-72 pl-2 pt-1 flex justify-between items-center gap-4'>
      <SearchBar value={query} onChange={(v)=>{ setQuery(v); setResults(null); }}/>
      <div className='flex items-center'>
        <Button variant={"secondary"} size={'md'} onclick={()=>{setmodalopen(true)}}startIcon={<PlusIcon size={'sm'}/>} endIcon={<ShareIcon size={'sm'}/>}className='mr-1'>Add Content</Button>
        <div className='pr-1'>
          <Button variant={"primary"} size={'md'} onclick={()=>{}} >Help</Button>
        </div>
        <div className='pr-1'>
          <Button variant={"secondary"} size={'md'} onclick={onSignout}>Log out</Button>
        </div>
      </div>
    </div>

    <div className='ml-72 pl-2 pt-4 flex flex-wrap gap-4'>
      {query.trim() ? (
        results===null ? (
          <p className='text-gray-500 text-sm'>Searching...</p>
        ) : results.length ? (
          results.map(c=><Card key={c.id} type={cardType(c.link)} title={c.title} link={c.link}/>)
        ) : (
          <p className='text-gray-500 text-sm'>No results for "{query}"</p>
        )
      ) : (
        <>
          <Card type="youtube" title="Some video" link="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
          <Card type="twitter" title="Some tweet" link="https://x.com/jack/status/20" />
        </>
      )}
    </div>
    </>
  )
}

export default Dashboard
