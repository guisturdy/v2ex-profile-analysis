const fetch = require('node-fetch')
const HttpsProxyAgent = require('https-proxy-agent')
const colors = require('colors')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('v2ex.db')

const CONFIG = require('./config').config

const proxy = [
  ...(CONFIG.proxy || []).map(proxy => new HttpsProxyAgent(proxy)),
  null
]

const freeProxy = 'x'.repeat(proxy.length).split('').map((_, i) => i)
const works = []
let workInterval
let requestCount = 0, warningCount = 0, errorCount = 0

let needFetchID = CONFIG.startID

function addWork(id, page = 1) {
  needFetchID = Math.max(id + 1, needFetchID)
  works.push([id, page])
}

function finishWork(id, page) {
  inWork.delete(`${id}:${page}`)
}

function getWork() {
  if (works.length === 0) {
    addWork(needFetchID)
    if (needFetchID > CONFIG.endID) {
      clearInterval(workInterval)
      return
    }
  }
  return works.pop()
}

async function doFetch(proxyIndex, work) {
  if (!work) {
    return
  }
  const [id, page] = work
  const url = `https://www.v2ex.com/amp/t/${id}/${page}`
  const startDate = new Date()
  await Promise.all([
    fetch(url, { agent: proxy[proxyIndex], timeout: 1000 * 5 })
      .then(res => res.text())
      .then(body => {
        logContent(body)
        insertRow({
          id, page, info: body, status: 200
        })
        const _page = body.match(/class=['"]pagination['"].*?共([0-9\s]*?)页/) || [0, 0]
        const totalPage = parseInt(_page[1]) || 0
        if (!totalPage) {
          warningCount++
        } else if (+totalPage > 1 && page === 1) {
          for (let p = totalPage; p > 1; p--) {
            addWork(id, p)
          }
        }
        console.log(colors.gray(`page: ${page}/${totalPage}`))
      }).catch(e => {
        errorCount++
        addWork(id, page)
        console.log(e)
      }).then(() => {
        const endDate = new Date()
        const cost = endDate.getTime() - startDate.getTime()
        requestCount++
        logInfo({ url, cost, requestCount, warningCount, errorCount, proxyIndex })
      }),
    new Promise(r => setTimeout(r, 1000 * 5))
  ]).then(() => {
    freeProxy.push(proxyIndex)
  })
}

function startWork() {
  workInterval = setInterval(() => {
    if (freeProxy.length) {
      doFetch(freeProxy.shift(), getWork())
    } else {
      console.log(colors.gray(`all proxy is busy`))
    }
  }, ~~(1000 * 5 / proxy.length));
}

const insertRow = ({ id, page, info, status }) => {
  db.run("INSERT INTO v2ex (id, page, info, status) VALUES (?, ?, ?, ?)", id, page, info, status)
}

db.serialize(function () {
  db.get("select count(*) as v2ex from sqlite_master where type='table' and name = 'v2ex'", (err, res) => {
    if (res.v2ex === 0) {
      db.run("CREATE TABLE v2ex (id int, page int, info TEXT, status int)")
    }
  })

  startWork()

})

function logContent(body) {
  const logText = body.match(/ class="topic_title"([\s\S]*?)class="topic_content"/)
  if (logText) {
    console.log(logText[1].replace(/<.*?>/g, '').replace(/[\s\n]{2,2}/g, ''))
  } else {
    console.log(body.replace(/<.*?>/g, '').replace(/[\s\n]{2,2}/g, '').slice(0, 200))
  }
}

function logInfo({ url, cost, requestCount, warningCount, errorCount, proxyIndex }) {
  console.log([
    colors.green(url),
    colors[cost < 1000 ? 'green' : 'yellow'](cost + 'ms'),
    colors.gray('proxyIndex:' + proxyIndex),
    '\n',
    colors.cyan('requestCount:' + requestCount),
    colors.yellow('warningCount:' + warningCount),
    colors.red('errorCount:' + errorCount),
    colors.gray(new Date().toLocaleString('zh-CN', { hour12: false }))
  ].join(' '))
}