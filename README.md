# Kettler Bridge
This software is a bridge between an old KettlerBike with USB Serial port to a fresh Bluetooth Low Energy peripheral implementing FTMS and some GATT services.
* the bike appears as a controlable Bike (FTMS, with SIM and ERG support)
* there is also a Cadence sensor, power meter and other services
* In SIM mode : It implements a Power Curve to fit to external feeling.

it's a work in progress:
* Working on the power curve
* Implementing Gear Shift
* Using Momentary buttons to shift gear up and down
* Oled screen feedback

I was able to test it on a Kettler Ergorace (https://www.bikeradar.com/reviews/training/indoor-trainers/resistance-trainer/kettler-ergorace-trainer-review/) and ZWIFT.


## setup
Install on a rasperypi zero with nodejs (version 8, some lib are not compiling on Node 10).

### Power
We  need to enable 1.2A USB power draw mode, otherwise the RPi limits the draw to 0.6A:
```
/boot/config.txt
---
# Force 1.2A USB draw
max_usb_current=1
```

### NodeJS
nodejs :  follow the link below and find a list of scripts.
Just run the ```wget``` of the selected version, and ... you have a node with the coreect version.
https://github.com/sdesalas/node-pi-zero
version 8.10 is OK

### BLeno special setup
We use the great bleno (from abandonware for continuous support) library for simulating a Bluetooth Peripheral followin the gatt FTMS protocol.
see https://github.com/noble/bleno

Stop the bluetooth service (Bleno implements another stack)
```
sudo systemctl disable bluetooth
sudo hciconfig hci0 up
```
install lib
```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

### KettlerUSB2BLE
* download the sources
```
git clone https://github.com/360manu/kettlerUSB2BLE.git
cd kettlerUSB2BLE
```

* Install
!! No Sudo for node install. It breaks the compilation
```
npm install
```
it can take a while as bleno must be compiled from sources.

### Bike Setup
just plug an USB cable from your PI (data USB, the central one) to the USB
I personnaly use 2 cables
* One Mini USB to USB B
* an old one from USB B to USB A
it's not very clean but it works

The Linux version installed on the PI already contains the CP21xx drivers.
-> Nothing special on this side

## Usage

### Start
First try (need to sudo for bleno):
```
sudo node server.js
```

You should hear a sound from the bike when the Serial connection is OK.
On the bike screen, you can now see the "USB" icons

If you scan for BLE peripheral (use Nordic RF app fro ANdroid or IPhone for example)
Your kettler bike should appear as KettlerBLE device with two services (power & FTMS)

### website
*  modify the index.ejs file with the ip of your raspbery
* start your browser pi-adress:3000
you can follow the bridge activity on a simple website.
It will display the current power, HR et speed and some logs


## future
* Power Curve description with config
* Oled feedback
* Gear Shift
