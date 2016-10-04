var element = document.createElement("div");
element.id = "anomalynks";

var content = '<div class="anls-control-panel" :class="{ show : isExpand.controlPanel, expanded: isExpand.graph }">' +
        '<a class="anls-tab" v-on:click="switchControlePanel">' +
            '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/>' +
                '<path d="M0-.75h24v24H0z" fill="none"/>' +
            '</svg>' +
        '</a>' +
        '<p class="anls-urls"><span class="anls-status">{{ status }}</span> {{ url }}</p>' +
        '<div class="anls-btns">' +
            '<a class="anls-btn clear" v-on:click="clearHistory">clear</a>' +
            '<a class="anls-btn output" :class="{ hover: isExpand.graph }" v-on:click="switchGraph">output' +
            '</a>' +
        '</div>' +
    '</div>' +
    '<div id="graph" :class="{ expanded: isExpand.graph }"></div>';
element.innerHTML = content;

var parent = document.body;
parent.appendChild(element);

var storageKey = "anomalynks";

new Vue({
    el: "#anomalynks",
    data: {
        history: [],
        status: "",
        url: "",
        isExpand: {
            controlPanel: false,
            graph: false
        }
    },
    created: function () {
        var that = this;

        this.url = location.href;
        chrome.runtime.sendMessage(
            {
                mode: "getStatusCode",
                url: location.href
            },
            function (response) {
                that.status = response.statusCode;
            }
        );
    },
    methods: {
        switchControlePanel: function () {
            this.isExpand.controlPanel = !this.isExpand.controlPanel;
        },

        switchGraph: function () {
            if (this.isExpand.graph == false) {
                this.isExpand.graph = true;
                this.render();
            } else {
                this.isExpand.graph = false;
                document.getElementById('graph').innerHTML = "";
                document.getElementById("graph").style.height = "0";
                document.getElementById("anomalynks").style.height = "0";
            }
        },

        getHistory: function () {
          var that = this;
          chrome.runtime.sendMessage(
              { mode: "getHistory" },
              function (response) {
                  that.history = response.history;
              }
          )
        },

        clearHistory: function () {
            chrome.runtime.sendMessage(
                { mode: "clearHistory" },
                function (response) {}
            )
        },

        render: function () {
            this.getHistory();
            chrome.runtime.sendMessage(
                { mode: "getHistory" },
                function (response) {
                    var nodes = [];
                    var edges = [];
                    var prev = null;

                    for (var i in response.history) {
                        var history = response.history[i];
                        var color = (history.status < 300) ? "#00ff00" : "#ff0000";
                        nodes.push({
                            data: {
                                id: history.url,
                                name: history.url,
                                status: history.status,
                                weight: 10,
                                faveColor: color,
                                faveShape: "rectangle"
                            }
                        });
                        if (prev != null) {
                            edges.push({
                                data: {
                                    source: prev.url,
                                    target: history.url,
                                    faveColor: '#6FB1FC',
                                    strength: 10
                                }
                            });
                        }
                        prev = history;
                    }


                    document.getElementById("anomalynks").style.height = "100%";
                    document.getElementById("graph").style.height = "100%";

                    var cy = cytoscape({
                        container: document.getElementById("graph"),
                        layout: {
                            name: 'cose',
                            padding: 10,
                            randomize: true
                        },

                        style: cytoscape.stylesheet()
                            .selector('node')
                                .css({
                                    'shape': 'data(faveShape)',
                                    'width': 'mapData(weight, 40, 80, 20, 60)',
                                    'content': 'data(name)',
                                    'text-valign': 'center',
                                    'background-color': 'data(faveColor)',
                                    'color': '#000'
                                })
                            .selector(':selected')
                                .css({
                                    'border-width': 3,
                                    'border-color': '#333',
                                    'content': 'data(status)',
                                })
                            .selector('edge')
                                .css({
                                    'curve-style': 'bezier',
                                    'opacity': 0.666,
                                    'width': 'mapData(strength, 70, 100, 2, 6)',
                                    'target-arrow-shape': 'triangle',
                                    'source-arrow-shape': 'circle',
                                    'line-color': 'data(faveColor)',
                                    'source-arrow-color': 'data(faveColor)',
                                    'target-arrow-color': 'data(faveColor)'
                                })
                            .selector('.faded')
                                .css({
                                    'opacity': 0.25,
                                    'text-opacity': 0
                                }),

                        elements: {
                            nodes: nodes,
                            edges: edges
                        }
                    });
                }
            )
        }
    }
});
