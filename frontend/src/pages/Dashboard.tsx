import { useState } from 'react'
import { Button } from '../components/ui/Button'

import { PlusIcon } from '../icons/plusicon'
import { ShareIcon } from '../icons/shareicon'
import { Card } from '../components/ui/Card'
import { ContentModal } from '../components/ui/ContentModal'
import { SideBar } from '../components/ui/Sidebar'
import { Crossicon } from '../icons/Crossicon'

export function Dashboard() {
 const [modalOpen,setmodalopen]=useState(false);

  return (
    <>
    
    <SideBar></SideBar>
    <ContentModal open={modalOpen} onclose={()=>setmodalopen(false)}>
   
    </ContentModal>
    
    <div className='flex justify-end items-center'>
      <Button variant={"secondary"} size={'md'} onclick={()=>{setmodalopen(true)}}startIcon={<PlusIcon size={'sm'}/>} endIcon={<ShareIcon size={'sm'}/>}className='mt-1 mr-1'>Add Content</Button>
      <div className='pr-1 pt-1'>
         <Button variant={"primary"} size={'md'} onclick={()=>{}} >Help</Button>
      </div>

      </div>
      <div className='ml-72 pl-2'>
       <div className="ml-72 pl-2 flex gap-4">
  <Card type="youtube" title="Some video" link="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
  <Card type="twitter" title="Some tweet" link="https://x.com/jack/status/20" />
</div>

      </div>
      
    </>
  )
}

export default Dashboard