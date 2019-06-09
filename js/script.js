/*
	Replace USD with THB for AliExpress.com (Firefox/Chrome Extension)
	Copyright (C) 2019  Pongsakorn Ritrugsa <poundxi@protonmail.com>

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

var _observerCallback = function(mutationsList) {
	for(var mutation of mutationsList) {
		if (mutation.type == 'childList') {
			mainReplace(mutation.target);
		} else if (mutation.type == 'attributes') {
			// ***********************************************************************************
			// * IF MADE CHANGE HTML IN THIS SECTION MIGHT BREAK SCRIPT WITH INFINITE RECURSIVE LOOP
			// * TO AVOID INFINITE LOOP YOU MIGHT SET FLAG TO HTML AND CHECK THIS CHANGE MADE BY YOU
			// ************************************************************************************
		}
	}
};

var _observerTargetNode = $("body")[0];
var _observerConfig = { attributes: true, childList: true, subtree: true };
var _observer = new MutationObserver(_observerCallback);

function checkUSDCurrencySelectStatus() {
	$("#switcher-info > span.currency").each(function() {
		if ($(this).text() !== "USD") {
			_usdCurrencySelected = false;
			return false; // break
		}
	});
}

function loadConfig() {
	function onGot(storageConfig) {
		if (storageConfig.enabled) {
			_extensionEnabled = storageConfig.enabled;
		}

		if (storageConfig.thb2usdExchangeRate) {
			_thb2usdExchangeRate = storageConfig.thb2usdExchangeRate;
		}

		onConfigLoaded();
	}

	chrome.storage.local.get(null, onGot);
}

function increaseAliExpressPageLoadCount() {
	function onGot(storageConfig) {
		// Increase only extension enabled
		if (storageConfig.enabled === true) {
			// Increase pageLoadCount
			var increasedPageLoadCount = storageConfig.pageLoadCount + 1;

			// Save value to storage
			chrome.storage.local.set({ pageLoadCount: increasedPageLoadCount });

			// Open contribution page when load aliexpress website many times
			if (increasedPageLoadCount >= _maxAliExpressPageLoadCount) {
				// Reset value to 1 and save to storage
				chrome.storage.local.set({ pageLoadCount: 1 });

				// Send message to background script
				chrome.runtime.sendMessage({"msg": "open_contribution_page"});
			}
		}
	}

	chrome.storage.local.get(null, onGot);
}

function isUsdPrice(text) {
	// Using regex match might be a better choice
	if (text.includes(_usWithSymbolText) || text.includes(_usdText) || text.includes("$"))
		return true;
	return false;
}

function usd2thbFloat(usd) {
	return usd * _thb2usdExchangeRate;
}

function usd2thbText(usdText, symbol=" " + _thbThaText) {
	var thbText = ""; // return value

	var texts = usdText
		// remove USD (not sure have this case)
		.replace(/USD/g, "")
		// remove US....$ (with unknown spaces)
		.replace(/US/g, "")
		.replace(/\$/g, "")
		.replace(/\n/g, "")
		.replace(/ /g, "")
		// split with "-" delemiter
		.split("-");

	if (texts.length == 1) {
		// US $xx.xx
		var usdPrice = parseFloat(texts[0].trim());
		thbText = formatNumber(usd2thbFloat(usdPrice));
	} else {
		// US $xx.xx - xx.xx
		// US $xx.xx - US $xx.xx
		var usdPriceLow = parseFloat(texts[0].trim());
		var usdPriceHigh = parseFloat(texts[1].trim());
		thbText = formatNumber(usd2thbFloat(usdPriceLow)) + " - " + formatNumber(usd2thbFloat(usdPriceHigh));
	}

	thbText += symbol;
	return thbText;
}

function mainReplace(element) {
	var hostname = window.location.hostname; // Returns domain name
	var pathname = window.location.pathname; // Returns path only
	var fullurl = window.location.href; // Returns full URL

	// if USD currency not selected
	if (!_usdCurrencySelected) {
		return; // exit function
	}

	/*
		- aliexpress.com
	*/
	if (pathname == "/")
	{
		// Top banner
		$(".crowd-entrance .crowd-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Flash deals, Top selection, New for you, More To Love
		$(".current-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- aliexpress.com/item
	*/
	else if (pathname.match(/\/item/g) || pathname.match(/\/store\/product/g))
	{
		// <span class="product-price-value" itemprop="price">US $24.44</span>
		// <span class="product-price-value" itemprop="price">US $7.23 - 24.44</span>
		$(".product-price-value").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Selected Shipping Method
		// Shipping: US $4.20 to Thailand via China Post Registered Air Mail
		// <span class="product-shipping-price bold">Shipping: US $4.20&nbsp;</span>
		$(".product-shipping-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var texts = text.split(_usWithSymbolText);
				var messageText = texts[0].trim();
				var usdPriceText = texts[1].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newText = `${messageText} ${thbPriceText} `;

				$(this).text(newText);
			}
		});

		// Shipping Method Modal
		$(".logistics .table-td").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Recommended For You
		$(".may-like-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Top Selling / Seller Recommendations / More To Love
		// <div class="item-info">
		// 	<div class="item-price">
		// 		<span>US $5.79</span>
		// 	</div>
		// </div>
		$(".item-info .item-price span").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- aliexpress.com/category
		- aliexpress.com/wholesale
		- aliexpress.com/premium
		- etc.
	*/
	else if (pathname.match(/[\/w]?\/wholesale/g)
		|| pathname.match(/^\/category/g)
		|| pathname.match(/^\/cheap/g)
		|| pathname.match(/^\/price/g)
		|| pathname.match(/^\/popular/g)
		|| pathname.match(/^\/promotion/g)
		|| pathname.match(/^\/premium/g)
		|| pathname.match(/reviews\.html$/g)
		|| fullurl.match(/SearchText=/g))
	{
		// Products (thumbnail view + list view)
		// <span class="value notranslate" itemprop="price">US $7.98</span>
		$("span.value").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Premium Related Products
		// <p class="p4p-price-list">US $35<span class="fwn"> / piece</span></p>
		$(".p4p-price-list").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var usdPriceText = text.split("/")[0].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newHtml = $(this).html().replace(usdPriceText, thbPriceText);

				$(this).html(newHtml);
			}
		});

		// Premium Related Products (Original price)
		// <div class="p4p-oriprice-block">
		// 	<del class="original-price">US $16.99</del>
		// 	<span class="new-discount-rate">12% off</span>
		// </div>
		$("del.original-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- my.aliexpress.com/wishlist
	*/
	else if (pathname.match(/^\/wishlist/g))
	{
		// <em class="price">US $0.56</em>
		$("em.price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// <del class="old-price">US $1.09<span class="unit">/ piece</span></del>
		$("del.old-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var usdPriceText = text.split("/")[0].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newHtml = $(this).html().replace(usdPriceText, thbPriceText);

				$(this).html(newHtml);
			}
		});

		// <p class="price-change me-icons price-reduce">Buy now and save US $0.09</p>
		$("p.price-reduce").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var usdPriceText = text.split(_usWithSymbolText)[1].trim();
				var thbPriceText = usd2thbText(usdPriceText);

				$(this).html(`ซื้อตอนนี้ประหยัดไปได้ ${thbPriceText}`);
			}
		});
	} // endif

	/*
		- shoppingcart.aliexpress.com/shopcart
	*/
	else if (fullurl.includes("shoppingcart.aliexpress.com/shopcart") || fullurl.includes("shoppingcart.aliexpress.com/orders.htm"))
	{
		// Shopping Cart
		$(".cost-main, .extend-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Shipping: US $5.49 Estimated Delivery Time:13-20 Days
		// <span class="logistics-cost">Shipping: US $5.49</span>
		$(".logistics-cost").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var messageText = text.split(":")[0].trim();
				var usdPriceText = text.split(":")[1].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newText = `${messageText} : ${thbPriceText}`;

				$(this).text(newText);
			}
		});

		// Shipment method modal
		// <div class="logistics-list">
		// 	<div class="table-td">Shipping: US $5.49</div>
		// </div>
		$(".logistics-list .table-td").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var messageText = text.split(":")[0].trim();
				var usdPriceText = text.split(":")[1].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newText = `${messageText} : ${thbPriceText}`;

				$(this).text(newText);
			}
		});

		// More To Love
		$("div.cost").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Order Summary
		// Subtotal/Shipping/Total
		// <dl class="charges-totle"><dt> Subtotal</dt><dd>US $0.00</dd></dl>
		// <dl class="charges-totle"><dt> Shipping</dt><dd>US $0.00</dd></dl>
		// <dl class="charges-totle"><dt> Savings</dt><dd>- US $3.52</dd></dl>
		// <div class="charges-detail"><dl><dt>Saved</dt><dd>- US $3.52</dd></dl></div>
		// <div class="total-price"><dl><dt>Total</dt><dd>US $0.00</dd></dl></div>
		if (!fullurl.includes("shoppingcart.aliexpress.com/orders.htm")) {
			$(".charges-totle dd, .charges-detail dd, .total-price dd").each(function() {
				var text = $(this).text();
				if (isUsdPrice(text)) {
					if (text.includes("-")) {
						$(this).text("- " + usd2thbText(text.replace("-", "")));
					} else {
						$(this).text(usd2thbText(text));
					}
				}
			});
		}

		// Order Summary Modal
		// <div class="next-dialog">
		// 	<div class="total-price">US $38.27</div>
		// </div>
		$(".next-dialog .total-price").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		// Subtotal / Shipping / Total
		// <div class="seller-charges">
			// <div class="charge-cost">US $32.78</div>
			// <div class="charge-cost">US $5.49</div>
			// <div class="total-cost">US $38.27</div>
		// </div>
		$(".seller-charges .charge-cost, .seller-charges .total-cost").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- sale.aliexpress.com
		- flashdeals.aliexpress.com.aliexpress.com
	*/
	else if (hostname == "sale.aliexpress.com" || hostname == "flashdeals.aliexpress.com")
	{
		$(".current-price, .original-price > del").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		$(".detail-price, .detail-oriprice").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- www.aliexpress.com/store/???????
	*/
	if (pathname.match(/\/store\/\d{6,10}$/g)) {
		$("h3, span").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});
	} // endif

	/*
		- www.aliexpress.com/store/???????
	*/
	if (pathname.match(/\/store\/\d{6,10}\/search/g)
	|| pathname.match(/\/store\/group/g)
	|| pathname.match(/\/store\/sale-items/g)
	|| pathname.match(/\/store\/top-rated-products/g)
	|| pathname.match(/\/store\/new-arrivals/g)
	|| pathname.match(/\/store\/other-products/g)
	|| pathname.match(/\/store\/all-wholesale-products/g))
	{
		$("div.cost b.notranslate").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				$(this).text(usd2thbText(text));
			}
		});

		$("div.cost-old del").each(function() {
			var text = $(this).text();
			if (isUsdPrice(text)) {
				var usdPriceText = text.split("/")[0].trim();
				var thbPriceText = usd2thbText(usdPriceText);
				var newHtml = $(this).html().replace(usdPriceText, thbPriceText);

				$(this).html(newHtml);
			}
		});
	} // endif

	/*
		- trade.aliexpress.com/order_list.htm
		- trade.aliexpress.com/orderList.htm
		- trade.aliexpress.com/issue/issue_list.htm
		- trade.aliexpress.com/ordertrash/orderTrash.htm
	*/
	else if (hostname == "trade.aliexpress.com")
	{
		if (pathname.includes('order_list.htm')
			|| pathname.includes('orderList.htm') // All Orders
			|| pathname.includes('ordertrash/orderTrash.htm') // Devared Orders
			|| pathname.includes('issue/issue_list.htm')) // Refunds & Disputes
		{
			// Orders
			// <p class="amount-num">US $ 1.87</p>
			$(".amount-num").each(function() {
				var text = $(this).text();
				if (isUsdPrice(text)) {
					$(this).text(usd2thbText(text));
				}
			});

			// Refunds & Disputes
			// <span>US $ 1.87 <br></span>
			$(".dispute-num span").each(function() {
				var text = $(this).text();
				if (isUsdPrice(text)) {
					$(this).html(usd2thbText(text) + " <br>");
				}
			});

			// Buyers who bought this item also bought
			$(".ui-slidebox-item b.notranslate").each(function() {
				var text = $(this).text();
				if (isUsdPrice(text)) {
					$(this).text(usd2thbText(text));
				}
			});
		}
	} // endif
} // mainReplace

function onConfigLoaded() {
	checkUSDCurrencySelectStatus();
	increaseAliExpressPageLoadCount();

	if (_extensionEnabled === true) {
		// Start observer
		_observer.observe(_observerTargetNode, _observerConfig);
	}
}

loadConfig(); // after load finished onConfigLoaded(); will executes
