var element = document.createElement("div");
element.id = "anomalynks";

var content = '{{ status }} {{ url }}' +
    '<button type="button" v-on:click="clearHistory">clear</button>' +
    '<button type="button" v-on:click="render">output</button>' +
    '<div id="graph"></div>';
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
                                    // 'text-outline-width': 2,
                                    // 'text-outline-color': 'data(faveColor)',
                                    'background-color': 'data(faveColor)',
                                    'color': '#000'
                                })
                            .selector(':selected')
                                .css({
                                    'border-width': 3,
                                    'border-color': '#333'
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
                            .selector('edge.questionable')
                                .css({
                                    'line-style': 'dotted',
                                    'target-arrow-shape': 'diamond'
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
                    cy.on('zoom', function(event) {
                      console.log(cy.zoom());
                    });
                }
            )
        }
    }
});
