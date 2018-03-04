async function main() {
	console.log(JSON.stringify(await getHierarchy()))
}
main()

function getDOM(url) {
	return new Promise(async (resolve, reject) => {
		const browser = await require("puppeteer").launch()
		const page = await browser.newPage()
		await page.goto("http://google.com/")
		resolve(new (require("jsdom").JSDOM)(await page.evaluate(() => document.body.parentNode.outerHTML)).window)
		// resolve((await page.evaluate(() => document.body.parentNode.outerHTML)))
		// await page.screenshot({ path: "example.png" })
		await browser.close()
	})
}

function getHierarchy() {
	return new Promise(async (resolve, reject) => {
		const constructHierarchy = (nodeList) => {
			const children = {}
			Array.prototype.forEach.call(nodeList, (v, i) => {
				if(v.tagName) {
					children[`${ i }_${ v.tagName }`] = constructHierarchy(v.childNodes)
				} else {
					children[`${ i }_${ v.nodeName }`] = v.data
				}
			})
			return children
		}
		// console.log((await getDOM()).document.childNodes[0].tagName)
		resolve(constructHierarchy((await getDOM()).document.childNodes))
	})
}
