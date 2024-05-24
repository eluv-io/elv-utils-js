# elv-utils-js/test/integration

These tests require a Content Fabric server.

The environment variable ELVUTILS_CONFIG must be set to the path of an [elv-utils-js configuration file](https://docs.eluv.io/docs/guides/media-ingest/advanced/#streamlining-commands-with-config-files).

To run against a local development node prepared using `elv-client-js/testScripts/InitializeTenant.js`, use the following as the contents of your config file (substitute your own test account private key):

```json
{
  "defaults": {
    "FABRIC_CONFIG_URL": "http://127.0.0.1:8008/config?qspace=dev&self",
    "groupAddress":      "0x8d8780cfa0970a064e247e4a7829f0106b38d7f7",
    "masterLib":         "ilib3fm7YhNrmYBNsgNwFuUso1CRVFw3",
    "masterType":        "iq__2tfLjovW8zMN9Yh6eLmwynX1Cbip",
    "mezLib":            "ilib29dvmbN91uyXRwcMX88CAs8q2zeT",
    "mezType":           "iq__8SLzhEyJWiJ41BPezhswG56MUwL",
    "PRIVATE_KEY":       "0x... (your test account private key"
  },
  "presets": {}
}
```

