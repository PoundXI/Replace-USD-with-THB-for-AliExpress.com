function onInstalled(details) {
	function gotSelf(info) {
		if (details.reason == "install") {
			chrome.tabs.create({ url: `html_custom/installed.html?version=${info.version}` });
		} else if (details.reason == "update") {
			chrome.tabs.create({ url: `html_custom/updated.html?version=${info.version}` });
		}
	}

	chrome.management.getSelf(gotSelf);

	initConfig();
	getEnabledStatusAndUpdateIcon();
	updateExchangeRate();
}

function onMessage(message) {
	if (message.msg == "open_contribution_page") {
		chrome.tabs.create({ url: "html_custom/contribution.html" });
	} else if (message.msg == "update_icon") {
		getEnabledStatusAndUpdateIcon();
	}
}

function onToolbarIconClicked() {
	_extensionEnabled = !_extensionEnabled;

	// save new status
	chrome.storage.local.set({ enabled: _extensionEnabled });

	getEnabledStatusAndUpdateIcon();

	function onGot(tabs) {
		if (tabs[0]) {
			// reload if current tab visiting aliexpress.com
			if (tabs[0].url.match(/aliexpress\.com/g)) {
				chrome.tabs.reload();
			}
		}
	}

	chrome.tabs.query({active: true, currentWindow: true}, onGot);
}

function onStartup() {
	initConfig();
	getEnabledStatusAndUpdateIcon();
	updateExchangeRate();
}

function initConfig() {
	function onGot(storageConfig) {
		if (storageConfig.enabled == undefined) {
			chrome.storage.local.set({ enabled: true });
		}

		if (storageConfig.thb2usdExchangeRate == undefined) {
			chrome.storage.local.set({ thb2usdExchangeRate: _thb2usdExchangeRate });
		}

		if (storageConfig.pageLoadCount == undefined) {
			chrome.storage.local.set({ pageLoadCount: 1 });
		}
	}

	chrome.storage.local.get(["enabled", "thb2usdExchangeRate", "pageLoadCount"], onGot);
}

function getEnabledStatusAndUpdateIcon() {
	function onGot(storageConfig) {
		// update status
		_extensionEnabled = storageConfig.enabled;

		// start extension for first time
		if (storageConfig.enabled == undefined) {
			chrome.storage.local.set({ enabled: true });
			_extensionEnabled = true;
		}

		// update icon
		chrome.browserAction.setIcon({
			path: _extensionEnabled ? {
				48: "icons/icon48px.png"
			} : {
				48: "icons/icon48px-gray.png"
			}
		});

		chrome.browserAction.setTitle({
			title: _extensionEnabled ?
			`${_extensionName}\n*  [คลิกเพื่อ ปิดการใช้งาน ✗]` :
			`${_extensionName}\n*  [คลิกเพื่อ เปิดการใช้งาน ✓]`
		});
	}

	chrome.storage.local.get("enabled", onGot);
}

function updateExchangeRate() {
	// get current USD to THB rate
	$.getJSON(_exchangeRateAPI, function(data) {
		$.each(data, function(key, value) {
			value *= 1.03;
			value = float2decimalpoints(value);
			if (value > 0) {
				// Update exchangerate to variable and storage
				_thb2usdExchangeRate = value;
				chrome.storage.local.set({ thb2usdExchangeRate: _thb2usdExchangeRate });
				return false; //break each loop
			}
		});
	});
}

chrome.browserAction.onClicked.addListener(onToolbarIconClicked);

// fired when profile first starts up (except incognito profile)
chrome.runtime.onStartup.addListener(onStartup);

// first installed / extension updated / browser updatd
chrome.runtime.onInstalled.addListener(onInstalled);

chrome.runtime.onMessage.addListener(onMessage);
