import { useState } from 'react'
import { Button } from './components/ui/Button'
import './App.css'
import { PlusIcon } from './icons/plusicon'
import { ShareIcon } from './icons/shareicon'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className='flex justify-end'>
      <Button variant={"secondary"} size={'md'} onclick={()=>{}}startIcon={<PlusIcon size={'sm'}/>} endIcon={<ShareIcon size={'sm'}/>}className='mt-1 mr-1'>Add Content</Button>
      </div>
    </>
  )
}

export default App
