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

Graph.prototype.getLabels = function(nodeId) {
    var node = this.nodes[nodeId];
    var labelLogProbabilities = node.labelLogProbabilities;
    
    var labelProbabilities = {};
    for(var i in this.labels) {
        var label = this.labels[i];
        labelProbabilities[label] = Math.exp(labelLogProbabilities[label]);
    }
    return labelProbabilities;
}

Graph.prototype.setLabelsProbability = function(nodeId, labelsProbabilityDistribution) {
    var node = this.nodes[nodeId];
    node.setLabelsProbability(labelsProbabilityDistribution);
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
    
    // normalize
    var arr = [];
    for(var i in labels) {
        arr.push(this.labelLogProbabilities[label]);
    }
    var sumLogProbabilities = logOfSum(arr);
    for(var i in labels) {
        this.labelLogProbabilities[label] -= sumLogProbabilities;
    }
}

Node.prototype.setLabelsProbability = function(labelsProbabilityDistribution) {
    for(var label in this.labelLogProbabilities) {
        var probability = labelsProbabilityDistribution[label];
        if(!probability) {
            probability = 0.000001;
        }
        this.labelLogProbabilities[label] = Math.log(probability);
    }
    
    // normalize
    var arr = [];
    for(var label in this.labelLogProbabilities) {
        arr.push(this.labelLogProbabilities[label]);
    }
    var sumLogProbabilities = logOfSum(arr);
    for(var label in this.labelLogProbabilities) {
        this.labelLogProbabilities[label] -= sumLogProbabilities;
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
    
    // normalize
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
    
    // replace old messages with new messages
    this.logMessagesTo = this.newLogMessagesTo;
    
    for(var id in this.logMessagesTo) {
        
        // normalize
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

graph.setLabelsProbability(1, {1 : 1});
graph.setLabelsProbability(2, {2 : 1});

graph.inference(40);
for(var id in graph.nodes) {
    console.log(id + '\n' + JSON.stringify(graph.getLabels(id), null, 4));
}

var sudokuGraph =
{
    1: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 21, 28, 31, 34, 55, 58, 61],
    2: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 21, 29, 32, 35, 56, 59, 62],
    3: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 21, 30, 33, 36, 57, 60, 63],
    4: [1, 2, 3, 5, 6, 7, 8, 9, 13, 14, 15, 22, 23, 24, 28, 31, 34, 55, 58, 61],
    5: [1, 2, 3, 4, 6, 7, 8, 9, 13, 14, 15, 22, 23, 24, 29, 32, 35, 56, 59, 62],
    6: [1, 2, 3, 4, 5, 7, 8, 9, 13, 14, 15, 22, 23, 24, 30, 33, 36, 57, 60, 63],
    7: [1, 2, 3, 4, 5, 6, 8, 9, 16, 17, 18, 25, 26, 27, 28, 31, 34, 55, 58, 61],
    8: [1, 2, 3, 4, 5, 6, 7, 9, 16, 17, 18, 25, 26, 27, 29, 32, 35, 56, 59, 62],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 25, 26, 27, 30, 33, 36, 57, 60, 63],
    
    10: [11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 19, 20, 21, 37, 40, 43, 64, 67, 70],
    11: [10, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 19, 20, 21, 38, 41, 44, 65, 68, 71],
    12: [10, 11, 13, 14, 15, 16, 17, 18, 1, 2, 3, 19, 20, 21, 39, 42, 45, 66, 69, 72],
    13: [10, 11, 12, 14, 15, 16, 17, 18, 4, 5, 6, 22, 23, 24, 37, 40, 43, 64, 67, 70],
    14: [10, 11, 12, 13, 15, 16, 17, 18, 4, 5, 6, 22, 23, 24, 38, 41, 44, 65, 68, 71],
    15: [10, 11, 12, 13, 14, 16, 17, 18, 4, 5, 6, 22, 23, 24, 39, 42, 45, 66, 69, 72],
    16: [10, 11, 12, 13, 14, 15, 17, 18, 7, 8, 9, 25, 26, 27, 37, 40, 43, 64, 67, 70],
    17: [10, 11, 12, 13, 14, 15, 16, 18, 7, 8, 9, 25, 26, 27, 38, 41, 44, 65, 68, 71],
    18: [10, 11, 12, 13, 14, 15, 16, 17, 7, 8, 9, 25, 26, 27, 39, 42, 45, 66, 69, 72],
    
    19: [20, 21, 22, 23, 24, 25, 26, 27, 1, 2, 3, 10, 11, 12, 46, 49, 52, 73, 76, 79],
    20: [19, 21, 22, 23, 24, 25, 26, 27, 1, 2, 3, 10, 11, 12, 47, 50, 53, 74, 77, 80],
    21: [19, 20, 22, 23, 24, 25, 26, 27, 1, 2, 3, 10, 11, 12, 48, 51, 54, 75, 78, 81],
    22: [19, 20, 21, 23, 24, 25, 26, 27, 4, 5, 6, 13, 14, 15, 46, 49, 52, 73, 76, 79],
    23: [19, 20, 21, 22, 24, 25, 26, 27, 4, 5, 6, 13, 14, 15, 47, 50, 53, 74, 77, 80],
    24: [19, 20, 21, 22, 23, 25, 26, 27, 4, 5, 6, 13, 14, 15, 48, 51, 54, 75, 78, 81],
    25: [19, 20, 21, 22, 23, 24, 26, 27, 7, 8, 9, 16, 17, 18, 46, 49, 52, 73, 76, 79],
    26: [19, 20, 21, 22, 23, 24, 25, 27, 7, 8, 9, 16, 17, 18, 47, 50, 53, 74, 77, 80],
    27: [19, 20, 21, 22, 23, 24, 25, 26, 7, 8, 9, 16, 17, 18, 48, 51, 54, 75, 78, 81],
    
    28: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 46, 47, 48, 1, 4, 7, 55, 58, 61],
    29: [28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 46, 47, 48, 2, 5, 8, 56, 59, 62],
    30: [28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39, 46, 47, 48, 3, 6, 9, 57, 60, 63],
    31: [28, 29, 30, 32, 33, 34, 35, 36, 40, 41, 42, 49, 50, 51, 1, 4, 7, 55, 58, 61],
    32: [28, 29, 30, 31, 33, 34, 35, 36, 40, 41, 42, 49, 50, 51, 2, 5, 8, 56, 59, 62],
    33: [28, 29, 30, 31, 32, 34, 35, 36, 40, 41, 42, 49, 50, 51, 3, 6, 9, 57, 60, 63],
    34: [28, 29, 30, 31, 32, 33, 35, 36, 43, 44, 45, 52, 53, 54, 1, 4, 7, 55, 58, 61],
    35: [28, 29, 30, 31, 32, 33, 34, 36, 43, 44, 45, 52, 53, 54, 2, 5, 8, 56, 59, 62],
    36: [28, 29, 30, 31, 32, 33, 34, 35, 43, 44, 45, 52, 53, 54, 3, 6, 9, 57, 60, 63],
    
    37: [38, 39, 40, 41, 42, 43, 44, 45, 28, 29, 30, 46, 47, 48, 10, 13, 16, 64, 67, 70],
    38: [37, 39, 40, 41, 42, 43, 44, 45, 28, 29, 30, 46, 47, 48, 11, 14, 17, 65, 68, 71],
    39: [37, 38, 40, 41, 42, 43, 44, 45, 28, 29, 30, 46, 47, 48, 12, 15, 18, 66, 69, 72],
    40: [37, 38, 39, 41, 42, 43, 44, 45, 31, 32, 33, 49, 50, 51, 10, 13, 16, 64, 67, 70],
    41: [37, 38, 39, 40, 42, 43, 44, 45, 31, 32, 33, 49, 50, 51, 11, 14, 17, 65, 68, 71],
    42: [37, 38, 39, 40, 41, 43, 44, 45, 31, 32, 33, 49, 50, 51, 12, 15, 18, 66, 69, 72],
    43: [37, 38, 39, 40, 41, 42, 44, 45, 34, 35, 36, 52, 53, 54, 10, 13, 16, 64, 67, 70],
    44: [37, 38, 39, 40, 41, 42, 43, 45, 34, 35, 36, 52, 53, 54, 11, 14, 17, 65, 68, 71],
    45: [37, 38, 39, 40, 41, 42, 43, 44, 34, 35, 36, 52, 53, 54, 12, 15, 18, 66, 69, 72],
    
    46: [47, 48, 49, 50, 51, 52, 53, 54, 28, 29, 30, 37, 38, 39, 19, 22, 25, 73, 76, 79],
    47: [46, 48, 49, 50, 51, 52, 53, 54, 28, 29, 30, 37, 38, 39, 20, 23, 26, 74, 77, 80],
    48: [46, 47, 49, 50, 51, 52, 53, 54, 28, 29, 30, 37, 38, 39, 21, 24, 27, 75, 78, 81],
    49: [46, 47, 48, 50, 51, 52, 53, 54, 31, 32, 33, 40, 41, 42, 19, 22, 25, 73, 76, 79],
    50: [46, 47, 48, 49, 51, 52, 53, 54, 31, 32, 33, 40, 41, 42, 20, 23, 26, 74, 77, 80],
    51: [46, 47, 48, 49, 50, 52, 53, 54, 31, 32, 33, 40, 41, 42, 21, 24, 27, 75, 78, 81],
    52: [46, 47, 48, 49, 50, 51, 53, 54, 34, 35, 36, 43, 44, 45, 19, 22, 25, 73, 76, 79],
    53: [46, 47, 48, 49, 50, 51, 52, 54, 34, 35, 36, 43, 44, 45, 20, 23, 26, 74, 77, 80],
    54: [46, 47, 48, 49, 50, 51, 52, 53, 34, 35, 36, 43, 44, 45, 21, 24, 27, 75, 78, 81],
    
    55: [56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 73, 74, 75, 1, 4, 7, 28, 31, 34],
    56: [55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 73, 74, 75, 2, 5, 8, 29, 32, 35],
    57: [55, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66, 73, 74, 75, 3, 6, 9, 30, 33, 36],
    58: [55, 56, 57, 59, 60, 61, 62, 63, 67, 68, 69, 76, 77, 78, 1, 4, 7, 28, 31, 34],
    59: [55, 56, 57, 58, 60, 61, 62, 63, 67, 68, 69, 76, 77, 78, 2, 5, 8, 29, 32, 35],
    60: [55, 56, 57, 58, 59, 61, 62, 63, 67, 68, 69, 76, 77, 78, 3, 6, 9, 30, 33, 36],
    61: [55, 56, 57, 58, 59, 60, 62, 63, 70, 71, 72, 79, 80, 81, 1, 4, 7, 28, 31, 34],
    62: [55, 56, 57, 58, 59, 60, 61, 63, 70, 71, 72, 79, 80, 81, 2, 5, 8, 29, 32, 35],
    63: [55, 56, 57, 58, 59, 60, 61, 62, 70, 71, 72, 79, 80, 81, 3, 6, 9, 30, 33, 36],
    
    64: [65, 66, 67, 68, 69, 70, 71, 72, 55, 56, 57, 73, 74, 75, 10, 13, 16, 37, 40, 43],
    65: [64, 66, 67, 68, 69, 70, 71, 72, 55, 56, 57, 73, 74, 75, 11, 14, 17, 38, 41, 44],
    66: [64, 65, 67, 68, 69, 70, 71, 72, 55, 56, 57, 73, 74, 75, 12, 15, 18, 39, 42, 45],
    67: [64, 65, 66, 68, 69, 70, 71, 72, 58, 59, 60, 76, 77, 78, 10, 13, 16, 37, 40, 43],
    68: [64, 65, 66, 67, 69, 70, 71, 72, 58, 59, 60, 76, 77, 78, 11, 14, 17, 38, 41, 44],
    69: [64, 65, 66, 67, 68, 70, 71, 72, 58, 59, 60, 76, 77, 78, 12, 15, 18, 39, 42, 45],
    70: [64, 65, 66, 67, 68, 69, 71, 72, 61, 62, 63, 79, 80, 81, 10, 13, 16, 37, 40, 43],
    71: [64, 65, 66, 67, 68, 69, 70, 72, 61, 62, 63, 79, 80, 81, 11, 14, 17, 38, 41, 44],
    72: [64, 65, 66, 67, 68, 69, 70, 71, 61, 62, 63, 79, 80, 81, 12, 15, 18, 39, 42, 45],
    
    73: [74, 75, 76, 77, 78, 79, 80, 81, 55, 56, 57, 64, 65, 66, 19, 22, 25, 46, 49, 52],
    74: [73, 75, 76, 77, 78, 79, 80, 81, 55, 56, 57, 64, 65, 66, 20, 23, 26, 47, 50, 53],
    75: [73, 74, 76, 77, 78, 79, 80, 81, 55, 56, 57, 64, 65, 66, 21, 24, 27, 48, 51, 54],
    76: [73, 74, 75, 77, 78, 79, 80, 81, 58, 59, 60, 67, 68, 69, 19, 22, 25, 46, 49, 52],
    77: [73, 74, 75, 76, 78, 79, 80, 81, 58, 59, 60, 67, 68, 69, 20, 23, 26, 47, 50, 53],
    78: [73, 74, 75, 76, 77, 79, 80, 81, 58, 59, 60, 67, 68, 69, 21, 24, 27, 48, 51, 54],
    79: [73, 74, 75, 76, 77, 78, 80, 81, 61, 62, 63, 70, 71, 72, 19, 22, 25, 46, 49, 52],
    80: [73, 74, 75, 76, 77, 78, 79, 81, 61, 62, 63, 70, 71, 72, 20, 23, 26, 47, 50, 53],
    81: [73, 74, 75, 76, 77, 78, 79, 80, 61, 62, 63, 70, 71, 72, 21, 24, 27, 48, 51, 54]
}