const rinnaiApi = require('./rinnai-api.js')
const entities = require('./entities.js')


const setTargetWaterTemperature = (temperature) => {
    rinnaiApi.setTargetTemperature(temperature)
}

const setPowerState = (turnOn) => {
    rinnaiApi.setPowerState(turnOn === "ON")
        .then((state) => updateDeviceState())
}

const increaseTemperature = () => {
    rinnaiApi.pressButton('inc')
        .then(state => {
            entities.waterTargetTemperature.publish(state.targetTemperature)
        })
}

const decreaseTemperature = () => {
    rinnaiApi.pressButton('dec')
        .then(state => {
            entities.waterTargetTemperature.publish(state.targetTemperature)
        })
}


const updateDeviceState = (retries = 0) => {
    if (rinnaiApi.getPreventUpdate()) {
        console.log("[DEVICE]: Preventing state update")
        return;
    }
    return rinnaiApi.getState()
        .then(({ targetTemperature, isHeating, isPoweredOn }) => {

            entities.waterTargetTemperature.publish(targetTemperature)
            entities.heatingState.publish(isHeating ? 'ON' : 'OFF')
            entities.switchHeating.publish(isPoweredOn ? 'ON' : 'OFF')
        })
        .catch(error => {
            if (retries < 5)
                return setTimeout(() => {
                    updateDeviceState(retries + 1)
                }, 500 * (retries + 1))
            console.error("[DEVICE] update state error:", error?.message || error)
            entities.waterTargetTemperature.updateAvailability(false)
            entities.heatingState.updateAvailability(false)
        })
}

const updateParameters = (retries = 0) => {
    if (rinnaiApi.getPreventUpdate()) {
        console.log("[DEVICE]: Preventing state update")
        return;
    }
    return rinnaiApi.getDeviceParams()
        .then(({
            inletTemperature,
            outletTemperature,
            powerInkW,
            waterFlow,
            workingTime }) => {

            entities.inletWaterTemperature.publish(inletTemperature)
            entities.outletWaterTemperature.publish(outletTemperature)
            entities.power.publish(powerInkW)
            entities.waterFlow.publish(waterFlow)

        })
        .catch(error => {
            if (retries < 5)
                return setTimeout(() => {
                    updateParameters(retries + 1)
                }, 500 * (retries + 1))

            console.error("[DEVICE] update params error:", error?.message || error)

            entities.inletWaterTemperature.updateAvailability(false)
            entities.outletWaterTemperature.updateAvailability(false)
            entities.power.updateAvailability(false)
            entities.waterFlow.updateAvailability(false)
        })
}



let lastWaterMeasurement = -1
let lastGasMeasurement = -1
let lastWorkingTime = -1
const updateConsumption = (retries = 0) => {
    return rinnaiApi.getConsumption()
        .then(({ water, gas, workingTime }) => {
            if (lastWaterMeasurement > water) {
                entities.waterConsumption.publish(0)
            }
            lastWaterMeasurement = water

            if (lastGasMeasurement > gas) {
                entities.gasConsumption.publish(0)
            }
            lastGasMeasurement = gas

            if (lastWorkingTime > workingTime) {
                entities.workingTime.publish(0)
            }
            lastWorkingTime = workingTime



            entities.waterConsumption.publish(water)
            entities.gasConsumption.publish(gas)
            entities.workingTime.publish(workingTime)

        })
        .catch((error) => {
            if (retries < 5)
                return setTimeout(() => {
                    updateConsumption(retries + 1)
                }, 500 * (retries + 1))
            console.error("[DEVICE] update consumption error:", error?.message || error)
            entities.waterConsumption.updateAvailability(false)
            entities.gasConsumption.updateAvailability(false)
            entities.workingTime.updateAvailability(false)

        })

}

module.exports = {
    setTargetWaterTemperature,
    setPowerState,
    increaseTemperature,
    decreaseTemperature,
    updateParameters,
    updateDeviceState,
    updateConsumption
}