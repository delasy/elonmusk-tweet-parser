const { EventEmitter } = require('events')
const axios = require('axios')

class CoinMarketCap extends EventEmitter {
  #apiKey = null

  constructor (apiKey) {
    super()

    this.#apiKey = apiKey
    this.#poll()
  }

  #poll () {
    const config = {
      headers: {
        'x-cmc_pro_api_key': this.#apiKey
      }
    }

    axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/map`, config).then((res) => {
      this.emit('data', res.data.data ?? [])
      setTimeout(this.#poll.bind(this), 5 * 60 * 1000)
    })
  }
}

module.exports = new CoinMarketCap(process.env.COINMARKETCAP_API_KEY)
