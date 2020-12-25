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

    function AmazonCostUsage(n) {
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
            let metric = msg.metric || n.metric || "AmortizedCost";
            let from = msg.from || n.from || new Date().toJSON().slice(0, 10);
            let to = msg.to || n.to || new Date().toJSON().slice(0, 10);
            let granularity = msg.granularity || n.granularity || "DAILY";

            node.status({ fill: "blue", shape: "dot", text: "aws.status.initializing" });

            let costExplorer = new AWS.CostExplorer({ region });
            let filters = await getAWSfilters(costExplorer, from, to);
            let params = {
                Metrics: [
                    /* required */
                    metric,
                    /* more items */
                ],
                TimePeriod: {/* required */
                    Start: from /* required */,
                    End: to /* required */,
                },
                Filter: {
                    /* Expression */
                    Dimensions: {
                        Key: "SERVICE",
                        MatchOptions: [
                            "EQUALS",
                            /* more items */
                        ],
                        Values: filters,
                    },
                },
                Granularity: granularity,
                GroupBy: [
                    {
                        Key: "SERVICE",
                        Type: "DIMENSION",
                    },
                    /* more items */
                ],
            };
            costExplorer.getCostAndUsage(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    node.error(RED._("aws.error.fail", { err: err }), msg);
                    node.status({ fill: "red", shape: "ring", text: "aws.status.error" });
                    return;
                }
                msg.payload = data;
                node.status({});
                node.send(msg); // successful response
            });
        });
    }

    const getAWSfilters = async (costExplorer, from, to) => {
        var dimensionParams = {
            Dimension: "SERVICE",
            TimePeriod: {/* required */
                End: to /* required */,
                Start: from /* required */,
            },
            Context: "COST_AND_USAGE",
        };
        let awsFilters = await costExplorer
            .getDimensionValues(dimensionParams, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    node.error(RED._("aws.error.fail", { err: err }), msg);
                    node.status({ fill: "red", shape: "ring", text: "aws.status.error" });
                    return;
                }

                return data;
            })
            .promise();

        return awsFilters.DimensionValues.map((dimension) => dimension.Value);
    };

    RED.nodes.registerType("amazon-cost-usage", AmazonCostUsage);
};