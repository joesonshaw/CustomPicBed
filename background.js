import {http} from './js/http.js';
chrome.action.onClicked.addListener(function (tab) {

	chrome.windows.getCurrent(function(screen) {
		var w = 800;
		var h = 550;
		var left = Math.round((screen.width / 2) - (w / 2));
		var top = Math.round((screen.height / 2) - (h / 2));

		chrome.windows.create({
			url : 'popup.html',
			width : w,
			height : h,
			focused : true,
			'left' : left,
			'top' : top,
			type : 'popup'
		});
	})
}); 
function packMsgRep(state, data, message) {
	return {
		state,
		uuid: message.uuid,
		data,
		timestamp: Date.now()
	};
}
 
async function parseHttpResponse(response) {
	if (response == null) {
		return {
			status: -2,
			statusText: null,
			body: null
		};
	} else if (response instanceof Error) {
		return {
			status: -1,
			statusText: `${response.name}: ${response.message}`,
			body: response.stack
		};
	} else {
		return {
			status: response.status,
			statusText: response.statusText,
			body: await response.text()
		};
	}
}
 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	new Promise(async (resolve, reject) => {
		if (typeof message != 'object' || !message.type) {
			console.error("消息格式不符合规范：", message);
			reject(`消息 ${JSON.stringify(message)} 格式不符合规范。`);
			return;
		}
		switch (message.type) {
			case 'FetchRequest': {
				http.request(message.data).then(response => {
					resolve(parseHttpResponse(response));
				}).catch(error => {
					reject(parseHttpResponse(error));
				});
				break;
			}
			case 'FetchGet': {
				http.get(message.data).then(response => {
					resolve(parseHttpResponse(response));
				}).catch(error => {
					reject(parseHttpResponse(error));
				});
				break;
			}
			case 'FetchPost': {
				const {url, data} = message.data
				let postdata = {}
				if (data.type == 'file') {
					const {file, paramName, filename, customBodyObj} = data
					let formData = new FormData()
					const obj = dataURLtoBlob(data[paramName])
					formData.append([paramName], obj, filename)
					for (const key in customBodyObj) {
						if (customBodyObj.hasOwnProperty.call(customBodyObj, key)) {
							const element = customBodyObj[key];
							formData.append([key], element)
						}
					}
					
					postdata = {
						url: url,
						data: formData
					}
				} else {
					postdata = message.data
				}
				http.post(postdata).then(response => {
					resolve(parseHttpResponse(response));
				}).catch(error => {
					reject(parseHttpResponse(error));
				});
				break;
			}
			default: {
				console.error("消息类型非法：", message);
				reject(`消息 ${message} 类型非法。`);
				break;
			}
		}
	}).then((response) => {
		sendResponse(packMsgRep(true, response, message));
		// console.log(`消息 ${JSON.stringify(message)} 处理完成。`);
	}).catch(e => {
		sendResponse(packMsgRep(false, e, message));
		console.error(`消息 ${JSON.stringify(message)} 处理失败：`, e);
	});
	return true;
});

const dataURLtoBlob = (dataUrl) => {
	let arr = dataUrl.split(','),
	mime = arr[0].match(/:(.*?);/)[1],
	bstr = atob(arr[1]),
	n = bstr.length,
	u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new Blob([u8arr], {
		type: mime,
	})
}	