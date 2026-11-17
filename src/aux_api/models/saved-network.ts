/* tslint:disable */
/* eslint-disable */
/**
 * Aux API
 * Hand-added to match `GET /wifi/saved` (MuonOS aux_api `SavedNetwork`) until the client is regenerated.
 */



/**
 * One saved Wi-Fi profile, as `GET /wifi/saved` reports it.
 * @export
 * @interface SavedNetwork
 */
export interface SavedNetwork {
    /**
     * NetworkManager profile name (usually the SSID).
     * @type {string}
     * @memberof SavedNetwork
     */
    'name': string;
    /**
     * 
     * @type {string}
     * @memberof SavedNetwork
     */
    'uuid': string;
    /**
     * 
     * @type {string}
     * @memberof SavedNetwork
     */
    'device'?: string | null;
}
