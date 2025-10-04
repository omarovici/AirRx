import * as cache from "./utils/caching.js"
import { globalResponse } from "./middlewares/global-response.middleware.js"
import { clearCache } from "./utils/crons.js"
import router from './module/router.js'


export const initiateApp = async (app, express) => {

    const port = process.env.PORT

    await cache.init()
    app.use(express.json())

    
    app.use('/', router)
    app.use((req, res, next) =>
    {
        res.status(404).json({ message: 'not found'})
    })
    app.use(globalResponse)
    clearCache()
    app.listen(port, () => console.log(`server started on port ${port}`))

}