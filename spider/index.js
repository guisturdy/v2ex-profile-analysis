const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const colors = require('colors');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('v2ex.db');

import config from './config'

const porxy = [
  ...(config.proxy || []).map(proxy => new HttpsProxyAgent(proxy)),
  null
]

const insertRow = ({ id, page, info, status }) => {
  db.run("INSERT INTO v2ex (id, page, info, status) VALUES (?, ?, ?, ?)", id, page, info, status)
}

db.serialize(function () {
  db.get("select count(*) as v2ex from sqlite_master where type='table' and name = 'v2ex'", (err, res) => {
    if (res.v2ex === 0) {
      db.run("CREATE TABLE v2ex (id int, page int, info TEXT, status int)")
    }
  })

  run()

})

async function run() {
  console.log('start')
  let requestCount = 0, errorCount = 0, warningCount = 0
  for (let index = config.startID; index < config.endID; index++) {
    let totalPage = 1, nowPage = 1
    while (totalPage >= nowPage) {
      const url = `https://www.v2ex.com/amp/t/${index}/${nowPage}`
      const startDate = new Date()
      await Promise.all([
        fetch(url, { agent: porxy[requestCount % porxy.length] })
          .then(res => res.text())
          .then(body => {
            logContent(logContent)
            insertRow({
              id: index, page: nowPage++, info: body, status: 200
            })
            const page = body.match(/class=['"]pagination['"].*?共([0-9\s]*?)页/) || [0, 0]
            totalPage = parseInt(page[1]) || 0
            if (!totalPage) {
              warningCount++
            }
            console.log(colors.gray('totalPage' + totalPage))
          }).catch(e => {
            insertRow({
              id: index, page: nowPage++, info: e, status: 0
            })
            errorCount++
            console.log(e)
          }).then(() => {
            const endDate = new Date()
            const cost = endDate.getTime() - startDate.getTime()
            requestCount++
            logInfo({ url, cost, requestCount, warningCount, errorCount })
          }),
        new Promise(r => setTimeout(r, 1000 * 5 / porxy.length))
      ])
    }
  }
}

function logContent(body) {
  const logText = body.match(/ class="topic_title"([\s\S]*?)class="topic_content"/)
  if (logText) {
    console.log(logText[1].replace(/<.*?>/g, '').replace(/[\s\n]{2,2}/g, ''))
  } else {
    console.log(body.replace(/<.*?>/g, '').replace(/[\s\n]{2,2}/g, '').slice(0, 200))
  }
}

function logInfo({ url, cost, requestCount, warningCount, errorCount }) {
  console.log([
    colors.green(url.replace('https://www.v2ex.com', '')),
    colors[cost < 1000 ? 'green' : 'yellow'](cost + 'ms'),
    colors.cyan('requestCount:' + requestCount),
    colors.yellow('warningCount:' + warningCount),
    colors.red('errorCount:' + errorCount)
  ].join(' '))
}