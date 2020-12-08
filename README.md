node-red-node-aws-service
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to receive cost usage from AWS.
This project is inspired and forked from <a href="http://nodered.org" target="_new">node-red-node-aws</a>

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-aws-service

Usage
-----

### AWS cost usage

Receive data from cost explorer. The event messages consist of the data
in `msg.payload` property.