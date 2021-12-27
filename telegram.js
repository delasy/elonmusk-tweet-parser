const { EventEmitter } = require('events')
const axios = require('axios')

const { Setting } = require('./models')
const { isNil } = require('./utils')

class Telegram extends EventEmitter {
  #botToken = null
  #lastId = null
  #settingName = 'telegram'
  #sendQueue = []

  static ParseMode = {
    HTML: 'HTML',
    MARKDOWN_V2: 'MarkdownV2'
  }

  static escapeMarkdown (text) {
    return text.replace(/[_*[\](){}~`>#+\-=|.!\\]/g, '\\$&')
  }

  static transformChat (chat) {
    return isNil(chat) ? null : {
      id: chat.id,
      type: chat.type,
      title: chat.title ?? null,
      username: chat.username ?? null,
      firstName: chat.first_name ?? null,
      lastName: chat.last_name ?? null
    }
  }

  static transformChatJoinRequest (chatJoinRequest) {
    return isNil(chatJoinRequest) ? null : {
      chat: Telegram.transformChat(chatJoinRequest.chat),
      from: Telegram.transformUser(chatJoinRequest.from),
      date: chatJoinRequest.date
    }
  }

  static transformChatMember (chatMember) {
    return isNil(chatMember) ? null : {
      status: chatMember.status,
      user: Telegram.transformUser(chatMember.user)
    }
  }

  static transformChatMemberUpdated (chatMemberUpdated) {
    return isNil(chatMemberUpdated) ? null : {
      chat: Telegram.transformChat(chatMemberUpdated.chat),
      date: chatMemberUpdated.date,
      oldChatMember: Telegram.transformChatMember(chatMemberUpdated.old_chat_member),
      newChatMember: Telegram.transformChatMember(chatMemberUpdated.new_chat_member)
    }
  }

  static transformMessage (message) {
    return isNil(message) ? null : {
      messageId: message.message_id,
      date: message.date,
      chat: Telegram.transformChat(message.chat),
      viaBot: message.via_bot ?? null,
      editDate: message.edit_date ?? null,
      hasProtectedContent: message.has_protected_content ?? null,
      mediaGroupId: message.media_group_id ?? null,
      authorSignature: message.author_signature ?? null,
      text: message.text ?? null,
      newChatMembers: isNil(message.new_chat_members) ? null : message.new_chat_members.map(Telegram.transformUser),
      leftChatMember: Telegram.transformUser(message.left_chat_member)
    }
  }

  static transformUpdate (update) {
    return isNil(update) ? null : {
      updateId: update.update_id,
      message: Telegram.transformMessage(update.message),
      editedMessage: Telegram.transformMessage(update.edited_message),
      myChatMember: Telegram.transformChatMemberUpdated(update.my_chat_member),
      chatMember: Telegram.transformChatMemberUpdated(update.chat_member),
      chatJoinRequest: Telegram.transformChatJoinRequest(update.chat_join_request)
    }
  }

  static transformUser (user) {
    return isNil(user) ? null : {
      id: user.id,
      isBot: user.is_bot,
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      languageCode: user.language_code ?? null
    }
  }

  constructor (botToken) {
    super()
    this.#botToken = botToken

    Setting.get(this.#settingName).then((setting) => {
      if (setting !== null) {
        this.#lastId = parseInt(setting.value)
      }

      this.#poll()
    })

    this.#pollSend()
  }

  deleteMessage (chatId, messageId) {
    this.#sendQueue.push({
      url: `https://api.telegram.org/bot${this.#botToken}/deleteMessage`,
      config: {
        params: {
          chat_id: chatId,
          message_id: messageId
        }
      }
    })
  }

  sendMessage (chatId, text, options = {}) {
    const chatIds = Array.isArray(chatId) ? chatId : [chatId]

    for (const chatId of chatIds) {
      const config = {
        params: {
          chat_id: chatId,
          text: text
        }
      }

      if (Object.prototype.hasOwnProperty.call(options, 'parseMode')) {
        config.params.parse_mode = options.parseMode
      }

      if (Object.prototype.hasOwnProperty.call(options, 'disableWebPagePreview')) {
        config.params.disable_web_page_preview = options.disableWebPagePreview.toString()
      }

      if (Object.prototype.hasOwnProperty.call(options, 'disableNotification')) {
        config.params.disable_notification = options.disableNotification.toString()
      }

      this.#sendQueue.push({
        url: `https://api.telegram.org/bot${this.#botToken}/sendMessage`,
        config: config
      })
    }
  }

  #poll () {
    const start = Date.now()

    const config = {
      params: {
        timeout: '5'
      }
    }

    if (this.#lastId !== null) {
      config.params.offset = this.#lastId + 1
    }

    axios.get(`https://api.telegram.org/bot${this.#botToken}/getUpdates`, config).then(async (res) => {
      if (!res.data.ok) {
        throw new Error(res.data.description)
      }

      res.data.result ??= []

      for (const update of res.data.result) {
        if (update.update_id > this.#lastId) {
          this.emit('update', Telegram.transformUpdate(update))
        }
      }

      const maxUpdateId = Math.max(...res.data.result.map(it => it.update_id), 0)

      if (isNil(this.#lastId) || maxUpdateId > this.#lastId) {
        this.#lastId = maxUpdateId
        await Setting.set(this.#settingName, this.#lastId.toString())
      }

      const delta = Date.now() - start
      setTimeout(this.#poll.bind(this), Math.max(0, 1000 - delta))
    })
  }

  #pollSend () {
    if (this.#sendQueue.length === 0) {
      setTimeout(this.#pollSend.bind(this), 100)
      return
    }

    const item = this.#sendQueue[0]

    axios.get(item.url, item.config)
      .then(() => {
        this.#sendQueue.shift()
        this.#pollSend()
      })
      .catch((err) => {
        const errorMessage = err?.response?.data?.description ?? err.message

        if (!errorMessage.startsWith('Too Many Requests')) {
          console.error(err)
        }

        setTimeout(this.#pollSend.bind(this), 60000)
      })
  }
}

module.exports = new Telegram(process.env.TELEGRAM_BOT_TOKEN)
module.exports.Telegram = Telegram
