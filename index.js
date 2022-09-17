import { Telegraf } from "telegraf";

import config from './config.json' assert {type: "json"}
import QuestService from './QuestService.js'

import { MongoClient } from 'mongodb'

// Connection URL
const client = new MongoClient(config.mongoDB)
await client.connect()
console.log('Connected successfully to mongo');
const db = client.db(config.dbName)

const bot = new Telegraf(config.apiKey)

bot.command('quit', (ctx) => {
  const service = new QuestService(ctx, db)
  service.leaveChat()
})

bot.on('text', (ctx) => {
  const service = new QuestService(ctx, db)
  service.controller()
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

