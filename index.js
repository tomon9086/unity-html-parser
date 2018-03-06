const Koa = require("koa")
const bodyParser = require("koa-bodyparser")
const xmlParser = require("koa-xml-body")
const logger = require("koa-logger")
const route = require("koa-route")

const app = new Koa()

const regex_url = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/

app.use(bodyParser())
// app.use(xmlParser())
app.use(logger())
app.use(route.get("/", async ctx => {
	ctx.type = "application/xml; charset=utf-8"
	ctx.body = await getHierarchy(getQuery(ctx.request.url).url)
}))

app.listen(3000)

function getQuery(str) {
	if(str === "") return
	const variables = str.split("?")[1].split("&")
	const obj = {}
	variables.forEach(function(v, i) {
		const variable = v.split("=")
		obj[variable[0]] = variable[1]
	})
	return obj
}

function getDOM(url) {
	return new Promise(async (resolve, reject) => {
		const browser = await require("puppeteer").launch()
		const page = await browser.newPage()
		await page.goto(url)
		resolve(new (require("jsdom").JSDOM)(await page.evaluate(() => document.body.parentNode.outerHTML)).window)
		// resolve((await page.evaluate(() => document.body.parentNode.outerHTML)))
		// await page.screenshot({ path: "example.png" })
		await browser.close()
	})
}

function getHierarchy(url) {
	if(!url || !url.match(regex_url)) return
	return new Promise(async (resolve, reject) => {
		const constructHierarchy = (nodeList) => {
			let children = ""
			Array.prototype.forEach.call(nodeList, (v, i) => {
				if(v.tagName) {
					children += 
						`<${ v.tagName } index="${ i }">
							${ constructHierarchy(v.childNodes) }
						</${ v.tagName }>`
				} else {
					children +=
						`<data type="${ v.nodeName }" index="${ i }">
							${ escapeChar(v.data) }
						</data>`
				}
			})
			return children
		}
		// console.log((await getDOM()).document.childNodes[0].tagName)
		resolve(`<?xml version="1.0" encoding="UTF-8" ?>\n` + constructHierarchy((await getDOM(url)).document.childNodes))
	})
}

function escapeChar(str) {
	str = str.replace(/&/g, "&amp;")
	str = str.replace(/'/g, "&apos;")
	str = str.replace(/"/g, "&quot;")
	str = str.replace(/</g, "&gt;")
	str = str.replace(/>/g, "&lt;")
	return str
}
