const AVAILABLE_TEMPERATURES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 50, 55, 60]
const RINNAI_STATE_TEMPERATURES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, null, 48, null, 50, 55, 60]

const parseTargetTemperatureToRange = (temperature) => {
    let newTargetTemperature = AVAILABLE_TEMPERATURES.includes(temperature) ? temperature : undefined
    if (!newTargetTemperature) {
        newTargetTemperature = AVAILABLE_TEMPERATURES.find((_, index) => {
            const nextAvailable = AVAILABLE_TEMPERATURES[index + 1]
            return nextAvailable > temperature
        })
    }

    if (!newTargetTemperature) {
        const lowestTemp = AVAILABLE_TEMPERATURES[0]
        const highestTemp = AVAILABLE_TEMPERATURES[AVAILABLE_TEMPERATURES.length - 1]
        if (temperature < lowestTemp) newTargetTemperature = lowestTemp
        if (temperature > highestTemp) newTargetTemperature = highestTemp
    }
    return newTargetTemperature
}


const parseRinnaiTemperature = (rinnaiTemp) => {
    const index = +rinnaiTemp - 3
    return RINNAI_STATE_TEMPERATURES[index]
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


module.exports = {
    parseTargetTemperatureToRange,
    parseRinnaiTemperature,
    delay
}