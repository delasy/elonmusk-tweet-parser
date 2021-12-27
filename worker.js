require('dotenv').config()

const { Op } = require('sequelize')

const { Chat, Cryptocurrency } = require('./models')
const { Telegram } = require('./telegram')
const coinMarketCap = require('./coin-market-cap')
const telegram = require('./telegram')
const twitter = require('./twitter')
const { isNil } = require('./utils')

async function analyzeTweet (tweet) {
  const words = tweet
    .replace(/@\w{1,15}/g, '')
    .replace(/https?:\/\/[\n\S]+/g, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .replace(/[A-Z]/g, it => ' ' + it.toLowerCase())
    .replace(/\s\s+/g, ' ')
    .trim()
    .split(' ')
    .map(it => it.toLowerCase())

  if (words.length === 0) {
    return []
  }

  const cryptocurrencyCandidates = await Cryptocurrency.findAll({
    where: {
      [Op.or]: words.filter(it => it.length >= 3).map((word) => {
        return {
          name: {
            [Op.iLike]: '%' + word + '%'
          }
        }
      })
    }
  })

  const cryptocurrencies = []

  for (const cryptocurrencyCandidate of cryptocurrencyCandidates) {
    const cryptocurrencyWords = cryptocurrencyCandidate.name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/[A-Z]/g, it => ' ' + it.toLowerCase())
      .replace(/\s\s+/g, ' ')
      .trim()
      .split(' ')
      .map(it => it.toLowerCase())

    let includesAllWords = true

    for (const cryptocurrencyWord of cryptocurrencyWords) {
      if (!words.includes(cryptocurrencyWord)) {
        includesAllWords = false
        break
      }
    }

    if (includesAllWords) {
      cryptocurrencies.push(cryptocurrencyCandidate)
    }
  }

  return cryptocurrencies
}

coinMarketCap.on('data', async (data) => {
  const cryptocurrencies = data.map((item) => {
    return {
      id: item.id,
      active: item.is_active,
      name: item.name,
      symbol: item.symbol,
      slug: item.slug
    }
  })

  await Cryptocurrency.bulkCreate(cryptocurrencies, {
    updateOnDuplicate: ['active', 'name', 'symbol', 'slug', 'updatedAt']
  })
})

twitter.on('tweet', async (chatIds, tweet) => {
  const tweetText = Telegram.escapeMarkdown(tweet.text)
    .replace(/&amp;/g, '&')
    .replace(/@\w{1,15}/g, it => it.slice(1))

  telegram.sendMessage(chatIds, '*Elon Musk*\n' + tweetText, {
    parseMode: Telegram.ParseMode.MARKDOWN_V2,
    disableWebPagePreview: true,
    disableNotification: true
  })

  analyzeTweet(tweet.text)
    .then((cryptocurrencies) => {
      if (cryptocurrencies.length === 0) {
        return
      }

      const cryptocurrenciesLinks = cryptocurrencies
        .map(it => `[${Telegram.escapeMarkdown(it.name)}](https://coinmarketcap.com/currencies/${it.slug}/)`)
        .join(', ')

      telegram.sendMessage(chatIds, '\u26A0\uFE0F\u26A0\uFE0F\u26A0\uFE0F\nFound: ' + cryptocurrenciesLinks, {
        parseMode: Telegram.ParseMode.MARKDOWN_V2,
        disableWebPagePreview: true
      })
    })
    .catch((err) => {
      console.error(err)
    })
})

telegram.on('update', async (update) => {
  if (update.myChatMember !== null) {
    await Chat.upsert({
      id: update.myChatMember.chat.id,
      status: update.myChatMember.newChatMember.status,
      type: update.myChatMember.chat.type,
      title: update.myChatMember.chat.title,
      username: update.myChatMember.chat.username,
      firstName: update.myChatMember.chat.firstName,
      lastName: update.myChatMember.chat.lastName
    })
  }

  if (!isNil(update.message) && (!isNil(update.message.newChatMembers) || !isNil(update.message.leftChatMember))) {
    telegram.deleteMessage(update.message.chat.id, update.message.messageId)
  }
})
