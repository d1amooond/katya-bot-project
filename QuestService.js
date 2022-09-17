import config from './config.json' assert { type: 'json' }

import firstRound from './data/first-round.json' assert {type: "json"}
import secondRound from "./data/second-round.json" assert {type: "json"}
import thirdRoound from "./data/third-round.json" assert {type: "json"}
import fourthRound from "./data/fourth-round.json" assert {type: "json"}
import fifthRound from "./data/fifth-round.json" assert {type: "json"}
import sixthRound from "./data/sixth-round.json" assert {type: "json"}
import seventhRound from "./data/seventh-round.json" assert {type: "json"}
import eighthRound from "./data/eighth-round.json" assert {type: "json"}
import ninethRound from "./data/nineth-round.json" assert {type: "json"}

import fs from 'fs'

export default class QuestService {
  constructor(ctx, db) {
    this.ctx = ctx
    this.db = db
    this.users = db.collection('users')
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  sleep() {
    return new Promise((resolve) => setTimeout(resolve, 1500))
  }

  async sendMessagesDelayed(messages) {
    for (let message of messages) {
      this.ctx.reply(message)
      await this.sleep()
    }
  }

  async leaveChat() {
    console.log('leave chat', this.ctx.message.chat.id)
    await this.users.findOneAndDelete({ chatId: this.ctx.message.chat.id })
    this.ctx.leaveChat()

    await this.ctx.telegram.sendMessage(config.adminChatId, "Катя покинула чат!")
  }

  async controller() {
    const username = this.ctx.message.from?.username
    const chatId = this.ctx.message.from?.id

    if (!config.accessUsernames.includes(username)) {
      return this.ctx.reply(`Щось мені здається, що квест був створенний не для тебе. Ти явно не Катя`)
    }

    const foundedUsers = await this.users.find({ username }).toArray()
    const existedUser = foundedUsers[0]

    if (existedUser) {
      return this.roundController(existedUser)
    }

    const messages = [
      'Катя, привіт.',
      'Радий що ти знайшла мого бота.',
      'Я хотів зробити подарунок більш менш оригінальним, тому для того щоб відкрити подарунок ти повинна пройти декілька завдань.',
      'За кожне завдання ти будеш отримувати літери.',
      'Напиши будь яке слово для того щоб почати!'
    ]

    await this.sendMessagesDelayed(messages)

    await this.ctx.telegram.sendMessage(config.adminChatId, "Катя почала проходження квесту!")

    await this.users.insertOne({
      username,
      round: 0,
      chatId
    })
  }

  roundController(existedUser) {
    switch (existedUser.round) {
      case 0:
        this.zeroRoundController(existedUser)
        break
      case 1:
        this.firstRoundController(existedUser)
        break
      case 2:
        this.secondRoundController(existedUser)
        break
      case 3:
        this.thirdRoundController(existedUser)
        break
      case 4:
        this.fourthRoundController(existedUser)
        break
      case 5:
        this.fifthRoundController(existedUser)
        break
      case 6:
        this.sixthRoundController(existedUser)
        break
      case 7:
        this.seventhRoundController(existedUser)
        break
      case 8:
        this.eighthRoundController(existedUser)
        break
      case 9:
        this.ninethRoundController(existedUser)
        break
      case 10:
        this.ctx.reply("Думаю, що ти вже пройшла мій квест)")
        break
    }
  }

  async zeroRoundController(existedUser) {
    await this.sendMessagesDelayed(firstRound.replies)

    await this.ctx.telegram.sendMessage(config.adminChatId, "Катя отримала перше завдання!")

    await this.users.updateOne({ username: existedUser.username }, { $set: { round: 1 } })
  }

  async firstRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(firstRound.answer)

    if (answer === correctAnswer ||
    answer > correctAnswer ? (answer - correctAnswer) <= firstRound.error : (correctAnswer - answer) <= firstRound.error) {
      const messages = [
        firstRound.successMessage,
        `Твоя перша літера: "${firstRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendPhoto(existedUser.chatId, secondRound.photo)

      await this.sendMessagesDelayed(secondRound.replies)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 1 завдання! Відповідь: ${answer}`)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 2 } })
    } else if (answer > correctAnswer ? (answer - correctAnswer) <= firstRound.lowError : (correctAnswer - answer) <= firstRound.lowError) {
      const msg = firstRound.lowIncorrectMessages[this.getRandomInt(0, firstRound.lowIncorrectMessages.length)]

      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 1 завдання: ${answer}`)

      return this.ctx.reply(msg)
    } else {
      const msg = firstRound.highIncorrectMessages[this.getRandomInt(0, firstRound.highIncorrectMessages.length)]

      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 1 завдання: ${answer}`)

      return this.ctx.reply(msg)
    }
  }

  async secondRoundController(existedUser) {
    const answer = this.ctx.message.text
    const correctAnswer = secondRound.answer

    if (answer === correctAnswer) {
      const messages = [
        secondRound.successMessage,
        `Твоя друга літера: "${secondRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 2 завдання! Відповідь: ${answer}`)

      await this.ctx.telegram.sendPhoto(existedUser.chatId, thirdRoound.photo)

      await this.sendMessagesDelayed(thirdRoound.replies)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 3 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 2 завдання: ${answer}`)
      return this.ctx.reply(secondRound.incorrectMessage)
    }
  }

  async thirdRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(thirdRoound.answer)

    if (answer === correctAnswer ||
    answer > correctAnswer ? (answer - correctAnswer) <= thirdRoound.error : (correctAnswer - answer) <= thirdRoound.error) {
      const messages = [
        thirdRoound.successMessage,
        `Твоя третя літера: "${thirdRoound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 3 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(fourthRound.replies)

      await this.ctx.telegram.sendVoice(existedUser.chatId, fourthRound.audio)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 4 } })
    } else if (answer > correctAnswer ? (answer - correctAnswer) <= thirdRoound.lowError : (correctAnswer - answer) <= thirdRoound.lowError) {
      const msg = thirdRoound.lowIncorrectMessages[this.getRandomInt(0, thirdRoound.lowIncorrectMessages.length)]
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 3 завдання: ${answer}`)
      return this.ctx.reply(msg)
    } else {
      const msg = thirdRoound.highIncorrectMessages[this.getRandomInt(0, thirdRoound.highIncorrectMessages.length)]
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 3 завдання: ${answer}`)
      return this.ctx.reply(msg)
    }
  }

  async fourthRoundController(existedUser) {
    const answer = this.ctx.message.text.toLowerCase().trim()
    const correctAnswer = fourthRound.answer.toLowerCase().trim()

    if (answer === correctAnswer) {
      const messages = [
        fourthRound.successMessage,
        `Твоя четверта літера: "${fourthRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 4 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(fifthRound.replies)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 5 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 4 завдання: ${answer}`)
      return this.ctx.reply(fourthRound.incorrectMessage)
    }
  }

  async fifthRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(fifthRound.answer)

    if (answer === correctAnswer) {
      const messages = [
        fifthRound.successMessage,
        `Твоя наступна літера: "${fifthRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 5 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(sixthRound.replies)

      await this.ctx.telegram.sendPhoto(existedUser.chatId, sixthRound.photo)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 6 } })
    } else if (answer > correctAnswer ? (answer - correctAnswer) <= fifthRound.lowError : (correctAnswer - answer) <= fifthRound.lowError) {
      const msg = fifthRound.lowIncorrectMessages[this.getRandomInt(0, fifthRound.lowIncorrectMessages.length)]

      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 5 завдання: ${answer}`)

      return this.ctx.reply(msg)
    } else {
      const msg = fifthRound.highIncorrectMessages[this.getRandomInt(0, fifthRound.highIncorrectMessages.length)]

      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 5 завдання: ${answer}`)

      return this.ctx.reply(msg)
    }
  }

  async sixthRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(sixthRound.answer)

    if (answer === correctAnswer) {
      const messages = [
        sixthRound.successMessage,
        `Твоя наступна літера: "${sixthRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 6 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(seventhRound.replies)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 7 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 6 завдання: ${answer}`)
      return this.ctx.reply(sixthRound.incorrectMessage)
    }
  }

  async seventhRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(seventhRound.answer)

    if (answer === correctAnswer) {
      const messages = [
        seventhRound.successMessage,
        `Твоя наступна літера: "${seventhRound.letter}"`,
        `Тепер можна перейти і до наступного завдання.`
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 7 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(eighthRound.replies)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 8 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 7 завдання: ${answer}`)
      return this.ctx.reply(seventhRound.incorrectMessage)
    }
  }

  async eighthRoundController(existedUser) {
    const answer = Number(this.ctx.message.text)
    const correctAnswer = Number(eighthRound.answer)

    if (answer === correctAnswer) {
      const messages = [
        eighthRound.successMessage,
        `Твоя наступна літера: "${eighthRound.letter}"`,
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 8 завдання! Відповідь: ${answer}`)

      await this.sendMessagesDelayed(ninethRound.replies)

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 9 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 8 завдання: ${answer}`)
      return this.ctx.reply(eighthRound.incorrectMessage)
    }
  }

  async ninethRoundController(existedUser) {
    const answer = this.ctx.message.text.toLowerCase().trim()
    const correctAnswer = ninethRound.answer.toLowerCase().trim()

    if (answer === correctAnswer) {
      const messages = [
        ninethRound.successMessage,
      ]

      await this.sendMessagesDelayed(messages)

      await this.ctx.telegram.sendMessage(config.adminChatId, `Катя прошла 9 завдання! Відповідь: ${answer}`)

      await this.ctx.telegram.sendVideoNote(existedUser.chatId, 'DQACAgIAAxkBAANoYyNxtAABIcRiKf6qSL3o4dgy5eeeAAJrHAAC1BUgSZWHM4qBuk6cKQQ')

      await this.users.updateOne({ username: existedUser.username }, { $set: { round: 10 } })
    } else {
      await this.ctx.telegram.sendMessage(config.adminChatId, `Неправильна відповідь на 9 завдання: ${answer}`)
      return this.ctx.reply(ninethRound.incorrectMessage)
    }
  }
}
