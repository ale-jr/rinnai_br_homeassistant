const options = require('./options.js')
const mqttClient = require("./mqtt.js")

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
const createEntity = (component, objectId, config) => {
    const extendedConfig = {
        ...config,
        object_id: `${deviceIdPrefix}${objectId}`,
        state_topic: getEntityTopic(component, objectId, 'state'),
        unique_id: `${deviceIdPrefix}${objectId}`,
        availability: {
            payload_available: 'online',
            payload_not_available: 'offline',
            topic: getEntityTopic(component, objectId, 'availability')
        },
        device: haDevice
    }

    if (['number', 'switch'].includes(component)) {
        extendedConfig.command_topic = getEntityTopic(component, objectId, 'set')
    }

    mqttClient.publish(getEntityTopic(component, objectId, 'config'), JSON.stringify(extendedConfig))

    const updateAvailability = (isAvailable) => {
        mqttClient.publish(getEntityTopic(component, objectId, 'availability'), isAvailable ? 'online' : 'offline')
    }

    const publish = (state) => {
        mqttClient.publish(getEntityTopic(component, objectId, 'state'), String(state))
        updateAvailability(true)
    }

    return {
        updateAvailability,
        publish,
        commandTopic: extendedConfig.command_topic
    }
}



const waterTargetTemperature = createEntity('number', 'target_water_temperature', {
    device_class: 'temperature',
    icon: 'mdi:thermometer-water',
    min: 35,
    max: 60,
    mode: 'box',
    name: 'Temperatura definida',
    optimistic: true,
    step: 1,
    unit_of_measurement: '°C'
})

const inletWaterTemperature = createEntity('sensor', 'inlet_water_temperature', {
    device_class: 'temperature',
    icon: 'mdi:water-thermometer-outline',
    name: 'Temperatura de entrada',
    unit_of_measurement: '°C'
})

const outletWaterTemperature = createEntity('sensor', 'outlet_water_temperature', {
    device_class: 'temperature',
    icon: 'mdi:water-thermometer',
    name: 'Temperatura de saída',
    unit_of_measurement: '°C'
})

const heatingState = createEntity('binary_sensor', 'heating_state', {
    device_class: 'power',
    icon: 'mdi:fire',
    name: 'Aquecendo água',
})

const switchHeating = createEntity('switch', 'heating_switch', {
    device_class: 'switch',
    optimistic: true,
    icon: 'mdi:power',
    name: 'Aquecedor'
})

const waterFlow = createEntity('sensor', 'water_flow', {
    icon: 'mdi:water',
    name: 'Fluxo de água',
    unit_of_measurement: 'L/min'
})

const power = createEntity('sensor', 'heating_power', {
    device_class: 'power',
    icon: 'mdi:fire',
    name: 'Potência',
    unit_of_measurement: 'kW'
})

const gasConsumption = createEntity('sensor', 'gas_consumption', {
    device_class: 'gas',
    icon: 'mdi:meter-gas-outline',
    name: 'Consumo total de gás',
    unit_of_measurement: 'm³',
    state_class: 'total_increasing'
})

const waterConsumption = createEntity('sensor', 'water_consumption', {
    device_class: 'volume',
    icon: 'mdi:water-plus-outline',
    name: 'Consumo total de água',
    unit_of_measurement: 'm³',
    state_class: 'total_increasing',
})

const workingTime = createEntity('sensor', 'working_time', {
    device_class: 'duration',
    icon: 'mdi:timer',
    name: 'Total de tempo em aquecimento',
    unit_of_measurement: 's',
    state_class: 'total_increasing'
})

module.exports = {
    waterTargetTemperature,
    inletWaterTemperature,
    outletWaterTemperature,
    heatingState,
    switchHeating,
    waterFlow,
    power,
    gasConsumption,
    waterConsumption,
    workingTime
}