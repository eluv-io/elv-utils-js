// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#libraryinfojs

const {expect, localDevTenantInfo, requireUtility, runUtilityTest} = require('../test-helpers')

const LibraryInfo = requireUtility('LibraryInfo.js')

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    const result = await runUtilityTest(
      LibraryInfo,
      [
        '--libraryId', localDevTenantInfo.mezLib
      ],
      {}
    )
    result.data.libraryInfo.metadata.elv.media.drm.fps.cert.should.equal('MIIExzCCA6+gAwIBAgIIHyfkXhxLHC4wDQYJKoZIhvcNAQEFBQAwfzELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkFwcGxlIEluYy4xJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MTMwMQYDVQQDDCpBcHBsZSBLZXkgU2VydmljZXMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMjAwOTEyMDMzMjI0WhcNMjIwOTEzMDMzMjI0WjBgMQswCQYDVQQGEwJVUzETMBEGA1UECgwKRWx1dmlvIEluYzETMBEGA1UECwwKMktIOEtDM01NWDEnMCUGA1UEAwweRmFpclBsYXkgU3RyZWFtaW5nOiBFbHV2aW8gSW5jMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDslbBURB6gj07g7VrS7Ojixe7FNZOupomcZt+mtMvyavjg7X7/T4RccmKUQxOoMLKCJcQ6WrdHhIpN8+bciq7lr0mNzaN467zREiUNYOpkVPi13sJLieY2m2MEPOQTbIl52Cu1YyH+4/g1dKPmeguSnzZRo36jsCGHlJBjHq0jkQIDAQABo4IB6DCCAeQwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBRj5EdUy4VxWUYsg6zMRDFkZwMsvjCB4gYDVR0gBIHaMIHXMIHUBgkqhkiG92NkBQEwgcYwgcMGCCsGAQUFBwICMIG2DIGzUmVsaWFuY2Ugb24gdGhpcyBjZXJ0aWZpY2F0ZSBieSBhbnkgcGFydHkgYXNzdW1lcyBhY2NlcHRhbmNlIG9mIHRoZSB0aGVuIGFwcGxpY2FibGUgc3RhbmRhcmQgdGVybXMgYW5kIGNvbmRpdGlvbnMgb2YgdXNlLCBjZXJ0aWZpY2F0ZSBwb2xpY3kgYW5kIGNlcnRpZmljYXRpb24gcHJhY3RpY2Ugc3RhdGVtZW50cy4wNQYDVR0fBC4wLDAqoCigJoYkaHR0cDovL2NybC5hcHBsZS5jb20va2V5c2VydmljZXMuY3JsMB0GA1UdDgQWBBR4jerseBHEUDC7mU+NQuIzZqHRFDAOBgNVHQ8BAf8EBAMCBSAwOAYLKoZIhvdjZAYNAQMBAf8EJgFuNnNkbHQ2OXFuc3l6eXp5bWFzdmdudGthbWd2bGE1Y212YzdpMC4GCyqGSIb3Y2QGDQEEAQH/BBwBd252bHhlbGV1Y3Vpb2JyZW4yeHZlZmV6N2Y5MA0GCSqGSIb3DQEBBQUAA4IBAQBM17YYquw0soDPAadr1aIM6iC6BQ/kOGYu3y/6AlrwYgAQNFy8DjsQUoqlQWFuA0sigp57bTUymkXEBf9yhUmXXiPafGjbxzsPF5SPFLIciolWbxRCB153L1a/Vh2wg3rhf4IvAZuJpnml6SSg5SjD19bN+gD7zrtp3yWKBKuarLSjDvVIB1SoxEToBs3glAEqoBiA2eZjikBA0aBlbvjUF2gqOmZjZJ7dmG1Tos2Zd4SdGL6ltSpKUeSGSxyv41aqF83vNpymNJmey2t2kPPtC7mt0LM32Ift3AkAl8Za9JbV/pOnc95oAfPhVTOGOI+u2BuB2qaKWjqHwkfqCz4A')
  })

  it('should error if --libraryId is missing', async () => {
    await runUtilityTest(
      LibraryInfo,
      [],
      {}
    ).catch((error) => expect(error.message).to.equal('Missing required argument: libraryId'))
  })
})
