import { Router } from "express"
import * as weatherController from "./controller.js"
import expressAsyncHandler from 'express-async-handler'
const router = Router()

router.get("/weather", expressAsyncHandler(weatherController.getWeather))
router.get("/pollutants", expressAsyncHandler(weatherController.getPollutants))

export default router