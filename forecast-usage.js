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

    function AmazonForecastUsage(n) {
        RED.nodes.createNode(this, n);
        this.awsConfig = RED.nodes.getNode(n.aws);

        var node = this;
        var AWS = this.awsConfig ? this.awsConfig.AWS : null;

        if (!AWS) {
            node.warn(RED._("aws.warn.missing-credentials"));
            node.status({ fill: "red", shape: "dot", text: "aws.warn.missing-credentials" });
            return;
        }

        node.on("input", async function (msg) {
            // eu-west-1||us-east-1||us-west-1||us-west-2||eu-central-1||ap-northeast-1||ap-northeast-2||ap-southeast-1||ap-southeast-2||sa-east-1
            let region = msg.region || n.region || "us-east-1";
            let metric = msg.metric || n.metric || "AMORTIZED_COST";
            
            let granularity = msg.granularity || n.granularity || "MONTHLY";

            let today = new Date();
            let from = msg.from || formatDateToString(today);
            let to = msg.to || getLastDayOfMonth(today.getFullYear(), today.getMonth() + 1);
            
            node.status({ fill: "blue", shape: "dot", text: "aws.status.initializing" });

            let costExplorer = new AWS.CostExplorer({ region });

            let params = {
                Granularity: granularity, /* required */
                Metric: metric, /* required */
                TimePeriod: { /* required */
                    End: to, /* required */
                    Start: from /* required */
                },
            };
            costExplorer.getCostForecast(params, function (err, data) {
                if (err) {
                    console.log('err', err)
                    node.error(RED._("aws.error.fail", { err: err }), msg);
                    node.status({ fill: "red", shape: "ring", text: "aws.status.error" });
                    return;
                };

                msg.payload = data;
                node.status({});
                node.send(msg); // successful response
            });
        });
    }

    const getLastDayOfMonth = (year, month) => {
        return formatDateToString(new Date(year, month + 1, 0));
    };
    
    const formatDateToString = (date) => {
        let year = String(date.getFullYear()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    RED.nodes.registerType("amazon-forecast-usage", AmazonForecastUsage);
};
