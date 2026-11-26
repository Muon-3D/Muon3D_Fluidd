export const FOREIGN_BRANDS = [
  {
    kind: "moonraker",
    label: "Klipper (Moonraker)",
    formFactor: "bed-slinger",
    via: "direct",
    steps: ["Enable browser access in Moonraker’s authorization settings."]
  },
  {
    kind: "octoprint",
    label: "OctoPrint",
    formFactor: "bed-slinger",
    via: "direct",
    steps: ["In Settings > API, enable Allow Cross Origin Resource Sharing, then restart OctoPrint."]
  },
  {
    kind: "creality",
    label: "Creality (stock firmware)",
    formFactor: "open-frame",
    via: "direct",
    steps: ["Connect the printer and this browser to the same local network."]
  },
  {
    kind: "elegoo-cc",
    label: "Elegoo Centauri Carbon",
    formFactor: "enclosed",
    model: "Centauri Carbon",
    via: "direct",
    steps: ["Connect the printer and this browser to the same local network."]
  },
  {
    kind: "bambu",
    label: "Bambu Lab",
    formFactor: "enclosed",
    via: "m1",
    steps: ["Enable LAN Only mode on the printer.", "Enable Developer Mode and LAN mode liveview if desired.", "Connect it through an M1 bridge."],
    docs: "https://wiki.bambulab.com/en/knowledge-sharing/enable-lan-mode"
  },
  {
    kind: "prusalink",
    label: "Prusa (PrusaLink)",
    formFactor: "bed-slinger",
    via: "m1",
    steps: ["Enable and configure PrusaLink on the printer.", "Connect it through an M1 bridge."],
    docs: "https://help.prusa3d.com/article/prusa-connect-and-prusalink-explained_302608?product=prusa-connect"
  },
  {
    kind: "anycubic",
    label: "Anycubic",
    formFactor: "bed-slinger",
    via: "m1",
    steps: ["Bind the printer to your local network using its setup guide.", "Connect it through an M1 bridge."],
    docs: "https://wiki.anycubic.com/en/fdm-3d-printer/kobra-3-combo/network-connection-guide"
  }
];
export const foreignBrand = (kind) => FOREIGN_BRANDS.find((brand) => brand.kind === kind);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJyYW5kcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEZvcmVpZ25LaW5kLCBGb3JtRmFjdG9yIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGludGVyZmFjZSBGb3JlaWduQnJhbmQge1xuICBraW5kOiBGb3JlaWduS2luZFxuICBsYWJlbDogc3RyaW5nXG4gIGZvcm1GYWN0b3I6IEZvcm1GYWN0b3JcbiAgbW9kZWw/OiBzdHJpbmdcbiAgdmlhOiAnZGlyZWN0JyB8ICdtMSdcbiAgc3RlcHM6IHN0cmluZ1tdXG4gIGRvY3M/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGNvbnN0IEZPUkVJR05fQlJBTkRTOiBGb3JlaWduQnJhbmRbXSA9IFtcbiAge1xuICAgIGtpbmQ6ICdtb29ucmFrZXInLFxuICAgIGxhYmVsOiAnS2xpcHBlciAoTW9vbnJha2VyKScsXG4gICAgZm9ybUZhY3RvcjogJ2JlZC1zbGluZ2VyJyxcbiAgICB2aWE6ICdkaXJlY3QnLFxuICAgIHN0ZXBzOiBbJ0VuYWJsZSBicm93c2VyIGFjY2VzcyBpbiBNb29ucmFrZXLigJlzIGF1dGhvcml6YXRpb24gc2V0dGluZ3MuJ11cbiAgfSxcbiAge1xuICAgIGtpbmQ6ICdvY3RvcHJpbnQnLFxuICAgIGxhYmVsOiAnT2N0b1ByaW50JyxcbiAgICBmb3JtRmFjdG9yOiAnYmVkLXNsaW5nZXInLFxuICAgIHZpYTogJ2RpcmVjdCcsXG4gICAgc3RlcHM6IFsnSW4gU2V0dGluZ3MgPiBBUEksIGVuYWJsZSBBbGxvdyBDcm9zcyBPcmlnaW4gUmVzb3VyY2UgU2hhcmluZywgdGhlbiByZXN0YXJ0IE9jdG9QcmludC4nXVxuICB9LFxuICB7XG4gICAga2luZDogJ2NyZWFsaXR5JyxcbiAgICBsYWJlbDogJ0NyZWFsaXR5IChzdG9jayBmaXJtd2FyZSknLFxuICAgIGZvcm1GYWN0b3I6ICdvcGVuLWZyYW1lJyxcbiAgICB2aWE6ICdkaXJlY3QnLFxuICAgIHN0ZXBzOiBbJ0Nvbm5lY3QgdGhlIHByaW50ZXIgYW5kIHRoaXMgYnJvd3NlciB0byB0aGUgc2FtZSBsb2NhbCBuZXR3b3JrLiddXG4gIH0sXG4gIHtcbiAgICBraW5kOiAnZWxlZ29vLWNjJyxcbiAgICBsYWJlbDogJ0VsZWdvbyBDZW50YXVyaSBDYXJib24nLFxuICAgIGZvcm1GYWN0b3I6ICdlbmNsb3NlZCcsXG4gICAgbW9kZWw6ICdDZW50YXVyaSBDYXJib24nLFxuICAgIHZpYTogJ2RpcmVjdCcsXG4gICAgc3RlcHM6IFsnQ29ubmVjdCB0aGUgcHJpbnRlciBhbmQgdGhpcyBicm93c2VyIHRvIHRoZSBzYW1lIGxvY2FsIG5ldHdvcmsuJ11cbiAgfSxcbiAge1xuICAgIGtpbmQ6ICdiYW1idScsXG4gICAgbGFiZWw6ICdCYW1idSBMYWInLFxuICAgIGZvcm1GYWN0b3I6ICdlbmNsb3NlZCcsXG4gICAgdmlhOiAnbTEnLFxuICAgIHN0ZXBzOiBbJ0VuYWJsZSBMQU4gT25seSBtb2RlIG9uIHRoZSBwcmludGVyLicsICdFbmFibGUgRGV2ZWxvcGVyIE1vZGUgYW5kIExBTiBtb2RlIGxpdmV2aWV3IGlmIGRlc2lyZWQuJywgJ0Nvbm5lY3QgaXQgdGhyb3VnaCBhbiBNMSBicmlkZ2UuJ10sXG4gICAgZG9jczogJ2h0dHBzOi8vd2lraS5iYW1idWxhYi5jb20vZW4va25vd2xlZGdlLXNoYXJpbmcvZW5hYmxlLWxhbi1tb2RlJ1xuICB9LFxuICB7XG4gICAga2luZDogJ3BydXNhbGluaycsXG4gICAgbGFiZWw6ICdQcnVzYSAoUHJ1c2FMaW5rKScsXG4gICAgZm9ybUZhY3RvcjogJ2JlZC1zbGluZ2VyJyxcbiAgICB2aWE6ICdtMScsXG4gICAgc3RlcHM6IFsnRW5hYmxlIGFuZCBjb25maWd1cmUgUHJ1c2FMaW5rIG9uIHRoZSBwcmludGVyLicsICdDb25uZWN0IGl0IHRocm91Z2ggYW4gTTEgYnJpZGdlLiddLFxuICAgIGRvY3M6ICdodHRwczovL2hlbHAucHJ1c2EzZC5jb20vYXJ0aWNsZS9wcnVzYS1jb25uZWN0LWFuZC1wcnVzYWxpbmstZXhwbGFpbmVkXzMwMjYwOD9wcm9kdWN0PXBydXNhLWNvbm5lY3QnXG4gIH0sXG4gIHtcbiAgICBraW5kOiAnYW55Y3ViaWMnLFxuICAgIGxhYmVsOiAnQW55Y3ViaWMnLFxuICAgIGZvcm1GYWN0b3I6ICdiZWQtc2xpbmdlcicsXG4gICAgdmlhOiAnbTEnLFxuICAgIHN0ZXBzOiBbJ0JpbmQgdGhlIHByaW50ZXIgdG8geW91ciBsb2NhbCBuZXR3b3JrIHVzaW5nIGl0cyBzZXR1cCBndWlkZS4nLCAnQ29ubmVjdCBpdCB0aHJvdWdoIGFuIE0xIGJyaWRnZS4nXSxcbiAgICBkb2NzOiAnaHR0cHM6Ly93aWtpLmFueWN1YmljLmNvbS9lbi9mZG0tM2QtcHJpbnRlci9rb2JyYS0zLWNvbWJvL25ldHdvcmstY29ubmVjdGlvbi1ndWlkZSdcbiAgfVxuXVxuXG5leHBvcnQgY29uc3QgZm9yZWlnbkJyYW5kID0gKGtpbmQ6IEZvcmVpZ25LaW5kKSA9PiBGT1JFSUdOX0JSQU5EUy5maW5kKGJyYW5kID0+IGJyYW5kLmtpbmQgPT09IGtpbmQpIVxuIl0sIm1hcHBpbmdzIjoiQUFZTyxhQUFNLGlCQUFpQztBQUFBLEVBQzVDO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsOERBQThEO0FBQUEsRUFDeEU7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsd0ZBQXdGO0FBQUEsRUFDbEc7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsaUVBQWlFO0FBQUEsRUFDM0U7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixPQUFPO0FBQUEsSUFDUCxLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsaUVBQWlFO0FBQUEsRUFDM0U7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsd0NBQXdDLDJEQUEyRCxrQ0FBa0M7QUFBQSxJQUM3SSxNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLFlBQVk7QUFBQSxJQUNaLEtBQUs7QUFBQSxJQUNMLE9BQU8sQ0FBQyxrREFBa0Qsa0NBQWtDO0FBQUEsSUFDNUYsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxPQUFPLENBQUMsaUVBQWlFLGtDQUFrQztBQUFBLElBQzNHLE1BQU07QUFBQSxFQUNSO0FBQ0Y7QUFFTyxhQUFNLGVBQWUsQ0FBQyxTQUFzQixlQUFlLEtBQUssV0FBUyxNQUFNLFNBQVMsSUFBSTsiLCJuYW1lcyI6W119