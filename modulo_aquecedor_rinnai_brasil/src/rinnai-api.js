const axios = require('axios')
const options = require('./options.js')
const { parseTargetTemperatureToRange, parseRinnaiTemperature } = require('./utils.js')
const rinnaiApi = axios.create({
    baseURL: `http://${options.device.host}`
})


const setPriority = (requirePriority) => {
    const priority = requirePriority ? options.haIp : "null"
    console.log("[RINNAI API] set priority to", priority)
    return rinnaiApi(`ip:${priority}:pri`)
        .then(() => true)
        .catch(() => false)
}


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let preventUpdate = false
const getPreventUpdate = () => preventUpdate
const startPreventingUpdates = () => preventUpdate = true
const stopPreventingUpdates = () => preventUpdate = false

const setTargetTemperature = async (target, lastTargetTemp = undefined, retries = 0) => {
    startPreventingUpdates()
    try {
        const targetTemperatureInRange = parseTargetTemperatureToRange(target)
        let currentTargetTemp = +lastTargetTemp
        if (!lastTargetTemp) {
            const { targetTemperature: stateTargetTemp, priorityIp } = await getState()
            currentTargetTemp = stateTargetTemp
            const otherDeviceHasPriority = priorityIp !== "null" && priorityIp !== options.haIp
            if (otherDeviceHasPriority) {
                console.log("[RINNAI API] other device has priority")
                stopPreventingUpdates()
                return false
            }
            await setPriority(true)

        }

        if (targetTemperatureInRange === currentTargetTemp) {
            stopPreventingUpdates()
            await setPriority(false)
            return currentTargetTemp
        }

        const operation = currentTargetTemp > targetTemperatureInRange ? 'dec' : 'inc'
        const response = await rinnaiApi(operation)
        const parsedParams = parseStateParams(response.data)
        currentTargetTemp = parsedParams.targetTemperature

        const otherDeviceHasPriority = parsedParams.priorityIp !== "null" && parsedParams.priorityIp !== options.haIp
        if (otherDeviceHasPriority) {
            console.log("[RINNAI API] other device has priority")
            stopPreventingUpdates()
            await setPriority(false)
            return false
        }

        if (targetTemperatureInRange === currentTargetTemp) {
            stopPreventingUpdates()
            await setPriority(false)
            return currentTargetTemp
        }

        await delay(100)

        setTargetTemperature(target, currentTargetTemp, 0)
    }
    catch (e) {
        if (retries < 5)
            return setTargetTemperature(target, lastTargetTemp, retries + 1)
        console.log("[RINNAI API] set temperature error", e?.message || e)
        stopPreventingUpdates()
        await setPriority(false)
        return false
    }
}



const parseStateParams = (stringifiedParams) => {
    const params = stringifiedParams.split(',')
    const targetTemperature = parseRinnaiTemperature(params[7])
    const isHeating = params[2] === '1'
    const priorityIp = params[6].split(":")[0]
    return {
        targetTemperature,
        isHeating,
        priorityIp
    }
}


const getState = () => {
    console.log("[RINNAI API] fetching heater state")
    return rinnaiApi('/tela_')
        .then(response => parseStateParams(response.data))
}

const getDeviceParams = () => {
    console.log("[RINNAI API] fetching heater parameters")
    return rinnaiApi('/bus')
        .then((response) => {
            const params = response.data.split(",")
            let targetTemperature = Math.ceil(+params[15] / 100)
            if (targetTemperature > 55) targetTemperature = 60
            const inletTemperature = +params[10] / 100
            const outletTemperature = +params[11] / 100
            const currentPowerInKCal = +params[9] / 100
            const isHeating = currentPowerInKCal > 0

            return {
                isHeating,
                targetTemperature,
                inletTemperature,
                outletTemperature
            }
        })
}

module.exports = {
    setTargetTemperature,
    getDeviceParams,
    getPreventUpdate,
    getState,
    setPriority
}