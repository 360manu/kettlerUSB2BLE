# Kettler Bridge

## setup
Install on a rasperypi zero or anything else with nodejs (lts version) installed.
* plug the USB cable with OTG cable on the second USB port
* download the sources
* have a look at bleno setup and https://github.com/olympum/waterrower-ble

```
npm install
```

it can tke a while as bleno must be compiled from sources.

## launch

```
node server.js
```

Your kettler bike will appear as KettlerBLE device with two services (power & FTMS)

## website
*  modify the index.ejs file with the ip of your raspbery
* start your browser pi-adress:3000
you can follow the bridge activity on a simple website.
It will display the current power, HR et speed and some logs


## future
* Zwift can connect and read the data.
* Zwift (ipad) recongnize the FTMS service 
* ~~]ERG mode is not yet implemented (FTMS control point)~~
