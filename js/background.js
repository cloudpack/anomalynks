console.log('background');

var storage = "anomalynks_history";
var responseList = {};

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        responseList[details.url] = details.statusCode;
    },
    {
        urls:["*://*/*"]
    }
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.mode) {
        case 'getStatusCode':
            sendResponse({
                statusCode: responseList[request.url]
            });

            var addHistory = function (url) {
                var items = localStorage.getItem(storage);
                var histories = JSON.parse(items) || [];

                histories.push({
                    url: url,
                    status: responseList[url]
                });
                console.log(histories);
                localStorage.setItem(storage, JSON.stringify(histories));
            }(request.url);

            responseList = {};

            break;
        case 'getHistory':
            sendResponse({
                history: JSON.parse(localStorage.getItem(storage)) || []
            });
            break;
        case 'clearHistory':
            localStorage.removeItem(storage);
            sendResponse({});

            break;
    }
});
