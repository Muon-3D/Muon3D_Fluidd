export class Configuration {
  /**
   * parameter for apiKey security
   * @param name security name
   * @memberof Configuration
   */
  apiKey;
  /**
   * parameter for basic security
   *
   * @type {string}
   * @memberof Configuration
   */
  username;
  /**
   * parameter for basic security
   *
   * @type {string}
   * @memberof Configuration
   */
  password;
  /**
   * parameter for oauth2 security
   * @param name security name
   * @param scopes oauth2 scope
   * @memberof Configuration
   */
  accessToken;
  /**
   * override base path
   *
   * @type {string}
   * @memberof Configuration
   */
  basePath;
  /**
   * override server index
   *
   * @type {number}
   * @memberof Configuration
   */
  serverIndex;
  /**
   * base options for axios calls
   *
   * @type {any}
   * @memberof Configuration
   */
  baseOptions;
  /**
   * The FormData constructor that will be used to create multipart form data
   * requests. You can inject this here so that execution environments that
   * do not support the FormData class can still run the generated client.
   *
   * @type {new () => FormData}
   */
  formDataCtor;
  constructor(param = {}) {
    this.apiKey = param.apiKey;
    this.username = param.username;
    this.password = param.password;
    this.accessToken = param.accessToken;
    this.basePath = param.basePath;
    this.serverIndex = param.serverIndex;
    this.baseOptions = {
      ...param.baseOptions,
      headers: {
        ...param.baseOptions?.headers
      }
    };
    this.formDataCtor = param.formDataCtor;
  }
  /**
   * Check if the given MIME is a JSON MIME.
   * JSON MIME examples:
   *   application/json
   *   application/json; charset=UTF8
   *   APPLICATION/JSON
   *   application/vnd.company+json
   * @param mime - MIME (Multipurpose Internet Mail Extensions)
   * @return True if the given MIME is JSON, false otherwise.
   */
  isJsonMime(mime) {
    const jsonMime = new RegExp("^(application/json|[^;/ 	]+/[^;/ 	]+[+]json)[ 	]*(;.*)?$", "i");
    return mime !== null && (jsonMime.test(mime) || mime.toLowerCase() === "application/json-patch+json");
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbmZpZ3VyYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG4vKipcbiAqIFNtYXJ0S25vYiBBVVggSFRUUCBBUElcbiAqIE5vIGRlc2NyaXB0aW9uIHByb3ZpZGVkIChnZW5lcmF0ZWQgYnkgT3BlbmFwaSBHZW5lcmF0b3IgaHR0cHM6Ly9naXRodWIuY29tL29wZW5hcGl0b29scy9vcGVuYXBpLWdlbmVyYXRvcilcbiAqXG4gKiBUaGUgdmVyc2lvbiBvZiB0aGUgT3BlbkFQSSBkb2N1bWVudDogMC4xLjBcbiAqIFxuICpcbiAqIE5PVEU6IFRoaXMgY2xhc3MgaXMgYXV0byBnZW5lcmF0ZWQgYnkgT3BlbkFQSSBHZW5lcmF0b3IgKGh0dHBzOi8vb3BlbmFwaS1nZW5lcmF0b3IudGVjaCkuXG4gKiBodHRwczovL29wZW5hcGktZ2VuZXJhdG9yLnRlY2hcbiAqIERvIG5vdCBlZGl0IHRoZSBjbGFzcyBtYW51YWxseS5cbiAqL1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlndXJhdGlvblBhcmFtZXRlcnMge1xuICAgIGFwaUtleT86IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB8ICgobmFtZTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgKChuYW1lOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPik7XG4gICAgdXNlcm5hbWU/OiBzdHJpbmc7XG4gICAgcGFzc3dvcmQ/OiBzdHJpbmc7XG4gICAgYWNjZXNzVG9rZW4/OiBzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4gfCAoKG5hbWU/OiBzdHJpbmcsIHNjb3Blcz86IHN0cmluZ1tdKSA9PiBzdHJpbmcpIHwgKChuYW1lPzogc3RyaW5nLCBzY29wZXM/OiBzdHJpbmdbXSkgPT4gUHJvbWlzZTxzdHJpbmc+KTtcbiAgICBiYXNlUGF0aD86IHN0cmluZztcbiAgICBzZXJ2ZXJJbmRleD86IG51bWJlcjtcbiAgICBiYXNlT3B0aW9ucz86IGFueTtcbiAgICBmb3JtRGF0YUN0b3I/OiBuZXcgKCkgPT4gYW55O1xufVxuXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhdGlvbiB7XG4gICAgLyoqXG4gICAgICogcGFyYW1ldGVyIGZvciBhcGlLZXkgc2VjdXJpdHlcbiAgICAgKiBAcGFyYW0gbmFtZSBzZWN1cml0eSBuYW1lXG4gICAgICogQG1lbWJlcm9mIENvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBhcGlLZXk/OiBzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4gfCAoKG5hbWU6IHN0cmluZykgPT4gc3RyaW5nKSB8ICgobmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4pO1xuICAgIC8qKlxuICAgICAqIHBhcmFtZXRlciBmb3IgYmFzaWMgc2VjdXJpdHlcbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICogQG1lbWJlcm9mIENvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICB1c2VybmFtZT86IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBwYXJhbWV0ZXIgZm9yIGJhc2ljIHNlY3VyaXR5XG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqIEBtZW1iZXJvZiBDb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgcGFzc3dvcmQ/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogcGFyYW1ldGVyIGZvciBvYXV0aDIgc2VjdXJpdHlcbiAgICAgKiBAcGFyYW0gbmFtZSBzZWN1cml0eSBuYW1lXG4gICAgICogQHBhcmFtIHNjb3BlcyBvYXV0aDIgc2NvcGVcbiAgICAgKiBAbWVtYmVyb2YgQ29uZmlndXJhdGlvblxuICAgICAqL1xuICAgIGFjY2Vzc1Rva2VuPzogc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+IHwgKChuYW1lPzogc3RyaW5nLCBzY29wZXM/OiBzdHJpbmdbXSkgPT4gc3RyaW5nKSB8ICgobmFtZT86IHN0cmluZywgc2NvcGVzPzogc3RyaW5nW10pID0+IFByb21pc2U8c3RyaW5nPik7XG4gICAgLyoqXG4gICAgICogb3ZlcnJpZGUgYmFzZSBwYXRoXG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqIEBtZW1iZXJvZiBDb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgYmFzZVBhdGg/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogb3ZlcnJpZGUgc2VydmVyIGluZGV4XG4gICAgICpcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgc2VydmVySW5kZXg/OiBudW1iZXI7XG4gICAgLyoqXG4gICAgICogYmFzZSBvcHRpb25zIGZvciBheGlvcyBjYWxsc1xuICAgICAqXG4gICAgICogQHR5cGUge2FueX1cbiAgICAgKiBAbWVtYmVyb2YgQ29uZmlndXJhdGlvblxuICAgICAqL1xuICAgIGJhc2VPcHRpb25zPzogYW55O1xuICAgIC8qKlxuICAgICAqIFRoZSBGb3JtRGF0YSBjb25zdHJ1Y3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBjcmVhdGUgbXVsdGlwYXJ0IGZvcm0gZGF0YVxuICAgICAqIHJlcXVlc3RzLiBZb3UgY2FuIGluamVjdCB0aGlzIGhlcmUgc28gdGhhdCBleGVjdXRpb24gZW52aXJvbm1lbnRzIHRoYXRcbiAgICAgKiBkbyBub3Qgc3VwcG9ydCB0aGUgRm9ybURhdGEgY2xhc3MgY2FuIHN0aWxsIHJ1biB0aGUgZ2VuZXJhdGVkIGNsaWVudC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtuZXcgKCkgPT4gRm9ybURhdGF9XG4gICAgICovXG4gICAgZm9ybURhdGFDdG9yPzogbmV3ICgpID0+IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKHBhcmFtOiBDb25maWd1cmF0aW9uUGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXBpS2V5ID0gcGFyYW0uYXBpS2V5O1xuICAgICAgICB0aGlzLnVzZXJuYW1lID0gcGFyYW0udXNlcm5hbWU7XG4gICAgICAgIHRoaXMucGFzc3dvcmQgPSBwYXJhbS5wYXNzd29yZDtcbiAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbiA9IHBhcmFtLmFjY2Vzc1Rva2VuO1xuICAgICAgICB0aGlzLmJhc2VQYXRoID0gcGFyYW0uYmFzZVBhdGg7XG4gICAgICAgIHRoaXMuc2VydmVySW5kZXggPSBwYXJhbS5zZXJ2ZXJJbmRleDtcbiAgICAgICAgdGhpcy5iYXNlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIC4uLnBhcmFtLmJhc2VPcHRpb25zLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIC4uLnBhcmFtLmJhc2VPcHRpb25zPy5oZWFkZXJzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5mb3JtRGF0YUN0b3IgPSBwYXJhbS5mb3JtRGF0YUN0b3I7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIE1JTUUgaXMgYSBKU09OIE1JTUUuXG4gICAgICogSlNPTiBNSU1FIGV4YW1wbGVzOlxuICAgICAqICAgYXBwbGljYXRpb24vanNvblxuICAgICAqICAgYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEY4XG4gICAgICogICBBUFBMSUNBVElPTi9KU09OXG4gICAgICogICBhcHBsaWNhdGlvbi92bmQuY29tcGFueStqc29uXG4gICAgICogQHBhcmFtIG1pbWUgLSBNSU1FIChNdWx0aXB1cnBvc2UgSW50ZXJuZXQgTWFpbCBFeHRlbnNpb25zKVxuICAgICAqIEByZXR1cm4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gTUlNRSBpcyBKU09OLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgcHVibGljIGlzSnNvbk1pbWUobWltZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGpzb25NaW1lOiBSZWdFeHAgPSBuZXcgUmVnRXhwKCdeKGFwcGxpY2F0aW9uXFwvanNvbnxbXjsvIFxcdF0rXFwvW147LyBcXHRdK1srXWpzb24pWyBcXHRdKig7LiopPyQnLCAnaScpO1xuICAgICAgICByZXR1cm4gbWltZSAhPT0gbnVsbCAmJiAoanNvbk1pbWUudGVzdChtaW1lKSB8fCBtaW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhcHBsaWNhdGlvbi9qc29uLXBhdGNoK2pzb24nKTtcbiAgICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQTBCTyxhQUFNLGNBQWM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFBQSxFQUVBLFlBQVksUUFBaUMsQ0FBQyxHQUFHO0FBQzdDLFNBQUssU0FBUyxNQUFNO0FBQ3BCLFNBQUssV0FBVyxNQUFNO0FBQ3RCLFNBQUssV0FBVyxNQUFNO0FBQ3RCLFNBQUssY0FBYyxNQUFNO0FBQ3pCLFNBQUssV0FBVyxNQUFNO0FBQ3RCLFNBQUssY0FBYyxNQUFNO0FBQ3pCLFNBQUssY0FBYztBQUFBLE1BQ2YsR0FBRyxNQUFNO0FBQUEsTUFDVCxTQUFTO0FBQUEsUUFDTCxHQUFHLE1BQU0sYUFBYTtBQUFBLE1BQzFCO0FBQUEsSUFDSjtBQUNBLFNBQUssZUFBZSxNQUFNO0FBQUEsRUFDOUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWU8sV0FBVyxNQUF1QjtBQUNyQyxVQUFNLFdBQW1CLElBQUksT0FBTyw0REFBaUUsR0FBRztBQUN4RyxXQUFPLFNBQVMsU0FBUyxTQUFTLEtBQUssSUFBSSxLQUFLLEtBQUssWUFBWSxNQUFNO0FBQUEsRUFDM0U7QUFDSjsiLCJuYW1lcyI6W119