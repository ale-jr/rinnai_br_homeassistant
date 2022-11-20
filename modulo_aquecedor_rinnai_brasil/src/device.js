const options = require('./options.js')
const mqttClient = require("./mqtt.js")
const rinnaiApi = require('./rinnai-api.js')

const deviceIdPrefix = `rinnai_br_${options.device.serialNumber}_`
const haDevice = {
    identifiers: [
        options.device.serialNumber
    ],
    manufacturer: 'Rinnai Brasil',
    model: options.device.model,
    name: `Rinnai ${options.device.model} (${options.device.serialNumber})`,

}

const getEntityTopic = (component, objectId, action) => `homeassistant/${component}/${deviceIdPrefix}${objectId}/${action}`

const discoverEntity = ({ component, objectId, config }) => {
    const stringifiedConfig = JSON.stringify({
        ...config,
        availability: {
            payload_available: 'online',
            payload_not_available: 'offline',
            topic: getEntityTopic(component, objectId, 'availabilty')
        },
        device: haDevice
    })

    return mqttClient.publish(getEntityTopic(component, objectId, 'config'), stringifiedConfig)
}

const SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC = getEntityTopic('number', 'target_water_temperature', 'set')
const discoverSetWaterTargetTemperature = () => {
    const component = 'number'
    const objectId = 'target_water_temperature'
    const config = {
        command_topic: SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC,
        device_class: 'temperature',
        icon: 'mdi:thermometer-water',
        min: 35,
        max: 60,
        mode: 'box',
        name: 'Temperatura definida',
        object_id: `${deviceIdPrefix}${objectId}`,
        optimistic: true,
        state_topic: getEntityTopic(component, objectId, 'state'),
        step: 1,
        unique_id: `${deviceIdPrefix}${objectId}`,
        unit_of_measurement: '°C'
    }
    discoverEntity({
        component,
        objectId,
        config
    })
}

const discoverInletWaterTemperature = () => {
    const component = 'sensor'
    const objectId = 'inlet_water_temperature'
    const config = {
        device_class: 'temperature',
        icon: 'mdi:water-thermometer-outline',
        name: 'Temperatura de entrada',
        object_id: `${deviceIdPrefix}${objectId}`,
        state_topic: getEntityTopic(component, objectId, 'state'),
        unique_id: `${deviceIdPrefix}${objectId}`,
        unit_of_measurement: '°C'
    }
    discoverEntity({
        component,
        objectId,
        config
    })
}
const discoverOutletWaterTemperature = () => {
    const component = 'sensor'
    const objectId = 'outlet_water_temperature'
    const config = {
        device_class: 'temperature',
        icon: 'mdi:water-thermometer',
        name: 'Temperatura de saída',
        object_id: `${deviceIdPrefix}${objectId}`,
        state_topic: getEntityTopic(component, objectId, 'state'),
        unique_id: `${deviceIdPrefix}${objectId}`,
        unit_of_measurement: '°C'
    }
    discoverEntity({
        component,
        objectId,
        config
    })
}

const discoverHeatingState = () => {
    const component = 'binary_sensor'
    const objectId = 'heating_state'
    const config = {
        device_class: 'power',
        icon: 'mdi:fire',
        name: 'Em funcionamento',
        object_id: `${deviceIdPrefix}${objectId}`,
        state_topic: getEntityTopic(component, objectId, 'state'),
        unique_id: `${deviceIdPrefix}${objectId}`
    }
    discoverEntity({
        component,
        objectId,
        config
    })
}

const discoverDevice = () => {
    discoverSetWaterTargetTemperature()
    discoverInletWaterTemperature()
    discoverOutletWaterTemperature()
    discoverHeatingState()
}


const setTargetWaterTemperature = (temperature) => {
    rinnaiApi.setTargetTemperature(temperature)
}

const publishEntity = ({
    component,
    objectId,
    state
}) => {
    mqttClient.publish(getEntityTopic(component, objectId, 'state'), String(state))
    updateEntityAvailability({ component, objectId, isAvailable: true })
}

const updateEntityAvailability = ({ component, objectId, isAvailable }) => {
    mqttClient.publish(getEntityTopic(component, objectId, 'availabilty'), isAvailable ? 'online' : 'offline')
}

const updateDeviceState = (retries = 0) => {
    if (rinnaiApi.getPreventUpdate()) {
        console.log("[DEVICE]: Preventing state update")
        return;
    }
    rinnaiApi.getState()
        .then(({ targetTemperature, isHeating }) => {
            publishEntity({
                component: 'number',
                objectId: 'target_water_temperature',
                state: targetTemperature
            })
            publishEntity({
                component: 'binary_sensor',
                objectId: 'heating_state',
                state: isHeating ? 'ON' : 'OFF'
            })
        })
        .catch(error => {
            if (retries < 5)
                return setTimeout(() => {
                    updateDeviceState(retries + 1)
                }, 500 * (retries + 1))
            console.error("[DEVICE] update state error:", error?.message || error)
            updateEntityAvailability({
                component: 'number',
                objectId: 'target_water_temperature',
                isAvailable: false
            })
            updateEntityAvailability({
                component: 'binary_sensor',
                objectId: 'heating_state',
                isAvailable: false
            })

        })
}

const updateParameters = (retries = 0) => {
    if (rinnaiApi.getPreventUpdate()) {
        console.log("[DEVICE]: Preventing state update")
        return;
    }
    rinnaiApi.getDeviceParams()
        .then(params => {

            publishEntity({
                component: 'sensor',
                objectId: 'inlet_water_temperature',
                state: params.inletTemperature
            })

            publishEntity({
                component: 'sensor',
                objectId: 'outlet_water_temperature',
                state: params.outletTemperature
            })


        })
        .catch(error => {
            if (retries < 5)
                return setTimeout(() => {
                    updateParameters(retries + 1)
                }, 500 * (retries + 1))

            console.error("[DEVICE] update params error:", error?.message || error)
            updateEntityAvailability({
                component: 'sensor',
                objectId: 'inlet_water_temperature',
                isAvailable: false
            })
            updateEntityAvailability({
                component: 'sensor',
                objectId: 'outlet_water_temperature',
                isAvailable: false
            })


        })
}


module.exports = {
    discoverDevice,
    setTargetWaterTemperature,
    SET_WATER_TARGET_TEMPERARUTURE_SET_TOPIC,
    updateParameters,
    updateDeviceState
}