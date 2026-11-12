import { useState } from 'react'
import { Button } from './components/ui/Button'
import './App.css'
import { PlusIcon } from './icons/plusicon'
import { ShareIcon } from './icons/shareicon'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className='flex justify-end items-center'>
      <Button variant={"secondary"} size={'md'} onclick={()=>{}}startIcon={<PlusIcon size={'sm'}/>} endIcon={<ShareIcon size={'sm'}/>}className='mt-1 mr-1'>Add Content</Button>
      <div className='pr-1 pt-1'>
         <Button variant={"primary"} size={'md'} onclick={()=>{}} >Help</Button>
      </div>

      </div>
    </>
  )
}

export default App
