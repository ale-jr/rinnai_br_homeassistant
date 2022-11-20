const device = require('./device.js')
const rinnaiApi = require('./rinnai-api.js')
const mqttClient = require('./mqtt.js')
const options = require("./options.js")
device.discoverDevice()

const { SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC } = device

const pollIntervalInMs = (options.device.poll_interval * 1_000) || 2_000

device.updateDeviceState()
setInterval(() => {
    device.updateDeviceState()
}, pollIntervalInMs)

device.updateParameters()
setInterval(() => {
    device.updateParameters()
}, pollIntervalInMs * 3)


rinnaiApi.setPriority(false)


mqttClient.on("connect", () => {
    console.log("[MQTT] Connected")
    mqttClient.subscribe(SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC, (error) => {
        if (error) console.log('[MQTT] set water target temp subscription error', error)
        else console.log('[MQTT] subscribed to set water target temp topic')
    })
})

mqttClient.on('message', (topic, message) => {
    if (topic === device.SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC) device.setTargetWaterTemperature(+message.toString())
})
