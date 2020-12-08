/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
    "use strict";

    function AWSNode(n) {
        RED.nodes.createNode(this, n);
        if (this.credentials &&
            this.credentials.accesskeyid && this.credentials.secretaccesskey) {
            this.AWS = require("aws-sdk");
            this.AWS.config.update({
                accessKeyId: this.credentials.accesskeyid,
                secretAccessKey: this.credentials.secretaccesskey,
            });
        }
    }

    RED.nodes.registerType("aws-config", AWSNode, {
        credentials: {
            accesskeyid: { type: "text" },
            secretaccesskey: { type: "password" }
        }
    });

    function AmazonCostUsage(n) {
        RED.nodes.createNode(this, n);
        this.awsConfig = RED.nodes.getNode(n.aws);
        // eu-west-1||us-east-1||us-west-1||us-west-2||eu-central-1||ap-northeast-1||ap-northeast-2||ap-southeast-1||ap-southeast-2||sa-east-1
        this.region = n.region || "us-east-1";
        
        var node = this;
        var AWS = this.awsConfig ? this.awsConfig.AWS : null;

        if (!AWS) {
            node.warn(RED._("aws.warn.missing-credentials"));
            return;
        }
        var costExplorer = new AWS.CostExplorer({ "region": node.region });
        var params = {
            Metrics: [ /* required */
                'AmortizedCost',
                /* more items */
            ],
            TimePeriod: { /* required */
                End: '2020-12-07', /* required */
                Start: '2020-12-01' /* required */
            },
            Granularity : "DAILY"
        };
        

        node.on("input", function (msg) {
            node.status({ fill: "blue", shape: "dot", text: "aws.status.initializing" });

            costExplorer.getCostAndUsage(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    node.error(RED._("aws.error.fail", { err: err }), msg);
                    node.status({ fill: "red", shape: "ring", text: "aws.status.error" });
                    return;
                }
                msg.payload = data;
                node.status({});
                node.send(msg);
                console.log(data);           // successful response
            });
        })
        
    }
    RED.nodes.registerType("amazon cost usage", AmazonCostUsage);
};