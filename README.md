# Kettler Bridge

## setup
Install on a rasperypi zero or anything else with nodejs installed.
plug the USB cable with OTG cable
have a look at bleno setup and https://github.com/olympum/waterrower-ble

```
npm install
```

## launch
```
node server.js
```

the kettler will appear as KettlerBLE device with two services (power & FTMS)
you can follow the bridge activity on a simple website : 192.168.1.36:3000 (for me)
don't hesitate to modify the index.ejs file with your ip

## future
* as of today Zwift can connect and read the data.
* ERG mode is not yet implemented (FTMS control point)
