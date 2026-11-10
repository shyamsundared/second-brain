import { useState } from 'react'
import { Button } from './components/ui/Button'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className='flex justify-end'>
      <Button variant={"secondary"} size={'md'} onclick={()=>{}} className='mt-1 mr-1'>hello</Button>
      </div>
    </>
  )
}

export default App
