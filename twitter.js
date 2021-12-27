const { EventEmitter } = require('events')
const axios = require('axios')

const { Chat, Setting } = require('./models')
const { isNil } = require('./utils')

class Twitter extends EventEmitter {
  #bearerToken = null
  #lastId = null
  #settingName = null
  #userId = null

  static transformTweet (tweet) {
    return {
      id: tweet.id,
      inReplyToUserId: tweet.in_reply_to_user_id ?? null,
      text: tweet.text,
      url: `https://twitter.com/u/status/${tweet.id}`,
      createdAt: tweet.created_at
    }
  }

  constructor (bearerToken, userId) {
    super()

    this.#bearerToken = bearerToken
    this.#settingName = `twitter-${userId}`
    this.#userId = userId

    Setting.get(this.#settingName).then((setting) => {
      if (setting !== null) {
        this.#lastId = setting.value
      }

      this.#poll()
    })
  }

  #poll () {
    const start = Date.now()

    const config = {
      headers: {
        authorization: `Bearer ${this.#bearerToken}`
      },
      params: {
        'tweet.fields': 'id,in_reply_to_user_id,text,created_at',
        exclude: 'replies'
      }
    }

    if (this.#lastId !== null) {
      config.params.since_id = this.#lastId
    }

    axios.get(`https://api.twitter.com/2/users/${this.#userId}/tweets`, config).then(async (res) => {
      res.data.data ??= []
      res.data.meta ??= {}
      res.data.meta.newest_id ??= this.#lastId
      res.data.data = res.data.data.reverse()

      const activeChatIds = res.data.data.length === 0 ? [] : await Chat.findActiveIds()

      for (const tweet of res.data.data) {
        this.emit('tweet', activeChatIds, Twitter.transformTweet(tweet))
      }

      if (isNil(this.#lastId) || res.data.meta.newest_id !== this.#lastId) {
        this.#lastId = res.data.meta.newest_id
        await Setting.set(this.#settingName, this.#lastId)
      }

      const delta = Date.now() - start
      setTimeout(this.#poll.bind(this), Math.max(0, 1000 - delta))
    })
  }
}

module.exports = new Twitter(process.env.TWITTER_BEARER_TOKEN, '44196397')
