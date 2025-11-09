import { useAppContext } from "../hooks/common";
import { randomString } from "../utils/helper";

export function Logs () {
    const ctx = useAppContext();
    const leftUrl = new URL(ctx?.settings?.leftLogPanelUrl || "");
    const rightUrl = new URL(ctx?.settings?.rightLogPanelUrl || "");
    leftUrl.searchParams.set("nocache", randomString(10));
    rightUrl.searchParams.set("nocache", randomString(10));
    
    return <div className="grid grid-cols-2 divide-x h-full">
        <iframe src={leftUrl.toString()} className="w-full h-full"></iframe>
        <iframe src={rightUrl.toString()} className="w-full h-full"></iframe>
    </div>
}