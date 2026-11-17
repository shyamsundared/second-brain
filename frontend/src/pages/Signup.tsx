import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/ContentModal";

export function Signup(){
    return <div className="w-screen h-screen flex justify-center items-center">
            <div>
                <div className="flex-col">
                    <Button variant={"primary"}>Signup</Button>
                    <Input placeholder="your name"/>
                </div>
            </div>
    </div>
}