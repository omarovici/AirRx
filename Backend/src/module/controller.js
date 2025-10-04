import * as Cache from "../utils/caching.js"
import openmeteo from "openmeteo"
import axios from 'axios'
export const getWeather = async (req, res, next) =>{
    const {long, lat} = req.query
    const isDataCached = await Cache.cacheGet(`weather:${lat}:${long}`)
    if (isDataCached)
        return res.status(200).json(isDataCached)
    const resp = await axios.get(`${process.env.WEATHER_ENDPOINT}`,
      {
        params:{
        key: process.env.API_KEY,
        "location.latitude": lat,
        "location.longitude": long 
      }
    }
    )
    const {data} = resp// fetch data from ai
    await Cache.cacheSet(`weather:${lat}:${long}`, data)
    return res.status(200).json(data)
}

export const getPollutants = async (req, res, next) =>{
    const {long, lat} = req.query
    const isDataCached = await Cache.cacheGet(`pollutant:${lat}:${long}`)
    
    if (isDataCached)
        return res.status(200).json(isDataCached)
    const requestBody = {
      "universalAqi": true,
      "location": {
        "latitude": lat,
        "longitude": long
      },
      "extraComputations": [
        "HEALTH_RECOMMENDATIONS",
        "DOMINANT_POLLUTANT_CONCENTRATION",
        "POLLUTANT_CONCENTRATION",
        "LOCAL_AQI",
        "POLLUTANT_ADDITIONAL_INFO"
      ],
      "languageCode": "en"
    };
    const config = {
      params: {
        key: process.env.API_KEY
      },
      headers: {
        'Content-Type': 'application/json' 
      }
    };
    console.log(process.env.API_ENDPOINT, requestBody, config);
    
    const response = await axios.post(
      process.env.AIRQUALITY_ENDPOINT,  
      requestBody,  
      config        
    )
    const {data} = response // send data to ai
    await Cache.cacheSet(`pollutant:${lat}:${long}`, data)
    return res.status(200).json(data)
}

