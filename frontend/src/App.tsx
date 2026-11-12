import { useState } from 'react'
import { Button } from './components/ui/Button'
import './App.css'
import { PlusIcon } from './icons/plusicon'
import { ShareIcon } from './icons/shareicon'
import { Card } from './components/ui/Card'
import { ContentModal } from './components/ui/ContentModal'
import { SideBar } from './components/ui/Sidebar'

function App() {
 const [modalOpen,setmodalopen]=useState(true);

  return (
    <>
    
    <SideBar></SideBar>
    <ContentModal open={modalOpen} onclose={()=>setmodalopen(false)}></ContentModal>
    <div className='flex justify-end items-center'>
      <Button variant={"secondary"} size={'md'} onclick={()=>{setmodalopen(true)}}startIcon={<PlusIcon size={'sm'}/>} endIcon={<ShareIcon size={'sm'}/>}className='mt-1 mr-1'>Add Content</Button>
      <div className='pr-1 pt-1'>
         <Button variant={"primary"} size={'md'} onclick={()=>{}} >Help</Button>
      </div>

      </div>
      <div className='ml-72 pl-2'>
        <Card/>
      </div>
      
    </>
  )
}

export default App
