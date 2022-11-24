const device = require('./device.js')
const rinnaiApi = require('./rinnai-api.js')
const mqttClient = require('./mqtt.js')
const options = require("./options.js")
const entities = require('./entities.js')
const { delay } = require('./utils.js')

const pollIntervalInMs = (options.device.poll_interval * 1_000) || 2_000


const update = async () => {
    await device.updateDeviceState()
    await delay(500)
    await device.updateParameters()
    await delay(500)
    await device.updateConsumption()
}


setInterval(update, pollIntervalInMs)


rinnaiApi.setPriority(false)


mqttClient.on("connect", () => {
    console.log("[MQTT] Connected")
    mqttClient.subscribe(entities.waterTargetTemperature.commandTopic, (error) => {
        if (error) console.log('[MQTT] set water target temp subscription error', error)
        else console.log('[MQTT] subscribed to set water target temp topic')
    })

    mqttClient.subscribe(entities.switchHeating.commandTopic, (error) => {
        if (error) console.log('[MQTT] switch heater subscription error', error)
        else console.log('[MQTT] subscribed to switch heater topic')
    })
})

mqttClient.on('message', (topic, message) => {
    switch (topic) {
        case entities.waterTargetTemperature.commandTopic:
            device.setTargetWaterTemperature(+message.toString())
            break;
        case entities.switchHeating.commandTopic:
            device.setPowerState(message.toString())
            break;
    }
})
