const options = require("./options.js")
const mqtt = require("mqtt")

const client = mqtt.connect({
    host: options.mqtt.host,
    username: options.mqtt.user,
    password: options.mqtt.password,
    resubscribe: true
})


client.on("error", (error) => {
    console.error("[MQTT] error", error)
})

module.exports = client