function Graph(adjacencyLists, labels) {
    this.labels = labels;
    
    this.nodes = {};
    this.edges = [];
    
    for(var nodeId1 in adjacencyLists) {
        
        var node1 = this.nodes[nodeId1];
        if(!node1) {
            node1 = new Node(nodeId1, labels);
            this.nodes[nodeId1] = node1;
        }
        
        var adjacencyList = adjacencyLists[nodeId1];
        
        for(var i in adjacencyList) {
            
            var nodeId2 = adjacencyList[i];
            var node2 = this.nodes[nodeId2];
            if(!node2) {
                node2 = new Node(nodeId2, labels);
                this.nodes[nodeId2] = node2;
            }
            
            if(node1.edges[nodeId2]) {
                continue;
            }
            
            var edge = new Edge(nodeId1, nodeId2, labels);
            node1.addEdge(edge);
            node2.addEdge(edge);
            
            this.edges.push(edge);
        }
    }
}

Graph.prototype.inference = function(iterations) {
    for(var it = 0; it < iterations; it++) {
        console.log(it);
        
        for(var id in this.nodes) {
            var node = this.nodes[id];
            node.updateMessages();
        }
        
        for(var i in this.edges) {
            var edge = this.edges[i];
            edge.refreshMessages();
        }
    }
    
    for(var id in this.nodes) {
        var node = this.nodes[id];
        node.calculateBeliefs();
    }
}

Graph.prototype.getLabels = function(id) {
    var node = this.nodes[id];
    var labelLogProbabilities = node.labelLogProbabilities;
    
    var labelProbabilities = {};
    for(var i in this.labels) {
        var label = this.labels[i];
        labelProbabilities[label] = Math.exp(labelLogProbabilities[label]);
    }
    return labelProbabilities;
}






function Node(id, labels) {
    this.id = id;
    
    this.edges = {};
    
    this.labelLogProbabilities = {};
    for(var i in labels) {
        var label = labels[i];
        //this.labelLogProbabilities[label] = Math.log(1.0 / labels.length);
        this.labelLogProbabilities[label] = Math.log(Math.random());
    }
}

Node.prototype.addEdge = function(edge) {
    var oppositeId = edge.getOppositeId(this.id);
    this.edges[oppositeId] = edge;
}

Node.prototype.calculateBeliefs = function() {
    for(var label in this.labelLogProbabilities) {
        var product = Math.log(1.0);
        
        for(var oppositeId in this.edges) {
            var edge = this.edges[oppositeId];
            product += edge.getMessage(this.id, label);
        }
        
        product += this.labelLogProbabilities[label];
        
        this.labelLogProbabilities[label] = product;
    }
    
    var arr = [];
    for(var label in this.labelLogProbabilities) {
        arr.push(this.labelLogProbabilities[label]);
    }
    
    var sumLogProbabilities = logOfSum(arr);
    for(var label in this.labelLogProbabilities) {
        this.labelLogProbabilities[label] -= sumLogProbabilities;
    }
}

Node.prototype.updateMessages = function() {
    for(var oppositeId in this.edges) {
        var edgeToOpposite = this.edges[oppositeId];
        
        for(var labelOpposite in this.labelLogProbabilities) {
            
            var message = -100;
            
            for(var label in this.labelLogProbabilities) {
                
                var product = Math.log(1.0);
                for(var oppositeIdInner in this.edges) {
                    if(oppositeIdInner == oppositeId) {
                        continue;
                    }
                    var edge = this.edges[oppositeIdInner];
                    product += edge.getMessage(this.id, label);
                }
                
                message = Math.max(this.labelLogProbabilities[label] + product + potential(labelOpposite, label), message);
            }
            
            edgeToOpposite.setNewMessage(oppositeId, labelOpposite, message);
        }
    }
}








function Edge(id1, id2, labels) {
    this.id1 = id1;
    this.id2 = id2;
    
    this.logMessagesTo = {};
    
    this.logMessagesTo[id1] = {};
    for(var i in labels) {
        var label = labels[i];
        this.logMessagesTo[id1][label] = Math.log(1);
    }
    
    this.logMessagesTo[id2] = {};
    for(var i in labels) {
        var label = labels[i];
        this.logMessagesTo[id2][label] = Math.log(1);
    }
    
    this.newLogMessagesTo = {};
    this.newLogMessagesTo[id1] = {};
    this.newLogMessagesTo[id2] = {};
}

Edge.prototype.getOppositeId = function(id) {
    if(this.id1 == id) {
        return this.id2;
    }
    
    if(this.id2 == id) {
        return this.id1;
    }
}

Edge.prototype.getMessage = function(id, label) {
    return this.logMessagesTo[id][label];
}

Edge.prototype.setNewMessage = function(id, label, value) {
    this.newLogMessagesTo[id][label] = value;
}

Edge.prototype.refreshMessages = function() {
    this.logMessagesTo = this.newLogMessagesTo;
    
    for(var id in this.logMessagesTo) {
        
        var arr = [];
        for(var label in this.logMessagesTo[id]) {
            arr.push(this.logMessagesTo[id][label]);
        }
        
        var logSum = logOfSum(arr);
        
        for(var label in this.logMessagesTo[id]) {
            this.logMessagesTo[id][label] -= logSum;
        }
    }
}






function potential(label1, label2) {
    if(label1 == label2) {
        return Math.log(0.00001);
    } else {
        return Math.log(1);
    }
}

function logOfSum(arrLogs) {
    var maxLog = arrLogs[0];
    for(var i = 1; i < arrLogs.length; i++) {
        maxLog = Math.max(maxLog, arrLogs[i]);
    }
    
    var sumExp = 0;
    for(var i = 0; i < arrLogs.length; i++) {
        sumExp += Math.exp(arrLogs[i] - maxLog);
    }
    
    return maxLog + Math.log(sumExp);
}




/*
 var graph = new Graph(
 {
 1: [3, 4, 10],
 2: [5, 4, 9],
 3: [1, 5, 8],
 4: [2, 1, 7],
 5: [2, 3, 6],
 6: [5, 10, 7],
 7: [4, 6, 8],
 8: [3, 7, 9],
 9: [2, 8, 10],
 10: [1, 6, 9]
 },
 ['red', 'green', 'blue']);
 */

var graph = new Graph(
                      {
                      1: [2, 3, 6, 7],
                      2: [1, 3, 5, 8],
                      3: [1, 2, 4, 9],
                      4: [3, 9, 5, 6],
                      5: [2, 8, 4, 6],
                      6: [1, 7, 4, 5],
                      7: [1, 6, 8, 9],
                      8: [2, 5, 7, 9],
                      9: [3, 4, 7, 8],
                      },
                      [1, 2, 3]);

graph.inference(40);
for(var id in graph.nodes) {
    console.log(id + '\n' + JSON.stringify(graph.getLabels(id), null, 4));
}