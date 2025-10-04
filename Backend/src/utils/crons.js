import { scheduleJob } from "node-schedule"
import * as Cache from "./caching.js"
export function clearCache(){
    scheduleJob("0 0 * * * *", async () =>{
        await Cache.cacheClear()
    })
}