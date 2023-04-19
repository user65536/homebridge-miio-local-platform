<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge MiIO Local Platform Plugin

>  ATTENTION: This is a newly created project and only support few of the MiIO Devices（cause I don't have other devices). Please be careful to use.

This is a homebridge platform plugin that bridges your MiIO devices to HomeKit with MiIO protocol only. MiIO is a protocol running in local network, so you don't need to provide your online account and credentials.

## Supported Devices

| Device Model         | HomeKit Device Type                                          |
| -------------------- | ------------------------------------------------------------ |
| viomi.vacuum.v7      | Fanv2 (vacuum service is not supported by HomeKit currently) |
| yeelink.light.lamp15 | Lightbulb                                                    |

## Plugin Config in Homebridge UI

| field        | type    | note                                                         |
| ------------ | ------- | ------------------------------------------------------------ |
| enable       | boolean | Whether this device is enabled or not. The corresponding HomeKit device will be removed from homebridge if you disable a device. |
| Device ID    | number  | MiIO device ID. You can look up the id and token of your devices using [Xiaomi Cloud Tokens Extractor](https://github.com/PiotrMachowski/Xiaomi-cloud-tokens-extractor) |
| Device Token | string  | MiIO device token.                                           |
| Device name  | string  | A human readable name for your device, used in device logs.  |



