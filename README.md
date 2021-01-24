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

## Minimal requirements
You need a Raspeberyy Pi zero W. The "W" version is important as you need the bluetooth version.

Kubii is a very good site, with good prices.
- the raspberry zeroW card: https://www.kubii.fr/les-cartes-raspberry-pi/1851-raspberry-pi-zero-w-kubii-3272496006997.html
- a small box to stick it under the bike : https://www.kubii.fr/accessoires-officiels-raspberry-pi/1845-boitier-officiel-pour-pi-zero-kubii-3272496006966.html
- a Micro SD card (4go is enough)
- Power Supply : USB charger 1 Ampere minimum
- micro USB cable of minimum 1.5m long (to run it along the bike)

the following kit contains a lot of stuff (Budget)
https://www.kubii.fr/home/2077-kit-pi-zero-w-kubii-3272496009509.html#/237-selectionnez_votre_kit-starter_16_go

To connect the Raspberry to the bike
- a usb cable B to micro-USB https://www.amazon.fr/Apark-USB-Connecteur-Interface-Adaptateur/dp/B0885SV415/ref=sr_1_6?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&dchild=1&keywords=cable%2BUSB%2Bb%2Bvers%2Bmicro%2Busb&qid=1606051026&quartzVehicle=694-1217&replacementKeywords=cable%2Busb%2Bvers%2Bmicro%2Busb&sr=8-6&th=1
- or an adaptor + usb Cable

## Quick Setup
An image of the full system is available.
You can directly download and write it on an sd card.

it contains:
- a Raspbian systeme
- KettlerUSB (without Oled Display)
- An autostart script

it also inclue
- a wifi hotspot to access the Pi. (password is always = Password)

Download this image
https://drive.google.com/file/d/13brFb1yyl03pNfKIfYgkOhw5_Ije4iDB/view?usp=sharing

Follow these instructions: 
https://opensource.com/article/17/3/how-write-sd-cards-raspberry-pi


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
The Bridge is also a simple web server.
It help debuging and have more feedback on the current state of the bike.

I use a static IP for the PI (see the doc of your router)
* modify the index.ejs (line 47) file with the ip of your raspbery
* start your browser pi-adress:3000

you can follow the bridge activity on a simple website.
It will display the current power, HR et speed and some logs.
It's also possible to switch gears.

### Running as a service
For an automatic launch with the raspberry 
```
sudo systemctl link /home/pi/kettlerUSB2BLE/kettler.service
```
-> Created symlink /etc/systemd/system/kettler.service → /home/pi/kettlerUSB2BLE/kettler.service.

```
sudo systemctl enable kettler.service
sudo systemctl start kettler.service
```

## future
* Power Curve description with config
* Oled feedback
* Gear Shift
