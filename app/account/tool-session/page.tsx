import type {Metadata} from "next";
import ToolSession from "./tool-session";
export const metadata:Metadata={title:"Connect your calculator | Linkoteq",robots:{index:false,follow:false}};
export default function Page(){return <ToolSession/>;}
