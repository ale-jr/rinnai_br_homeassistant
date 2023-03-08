const find = require('local-devices')
const axios = require('axios')

const findHeaters = () => {
    return find({
        skipNameResolution: true
    }).then(devices => {
        const promises = devices.map(({ ip }) =>
            axios({
                url: `http://${ip}/bus`,
                timeout: 3_000
            })
                .then((response) => {
                    const heaterIp = response.data?.split(',')[16]
                    const isHeater = heaterIp === ip
                    if (isHeater)
                        return ip

                    return null
                })
                .catch(() => {
                    return null
                })

        )

        return Promise.all(promises).then((allDevices) => {
            const heaters = allDevices.filter((ip) => !!ip)
            return heaters
        })
    })
}

findHeaters()
    .then(heaters => {
        console.log("heaters", heaters)
    })