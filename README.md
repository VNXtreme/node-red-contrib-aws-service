# node-red-node-aws-service
-------

A <a href="http://nodered.org" target="_new">Node-RED</a> node to receive service cost usage from AWS.
This project is inspired and forked from <a href="https://github.com/node-red/node-red-web-nodes" target="_new">node-red-node-aws</a>

# Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-aws-service

# Usage
-----

### AWS service cost usage, forecast cost usage

Receive data from CostExplorer API. The event messages consist of the data in `msg.payload` property.
These nodes requires Read permission in Policy of Cost Explorer Service. For reference, please check <a href="https://stackoverflow.com/a/63225391" target="_new">this guide</a>.
