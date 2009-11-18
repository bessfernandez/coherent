/** @name URL
    @class
    
    @param {String} url - The URL to use to pull apart.
    @property {String} url - The original URL used to create this object
    @property {String} protocol - The protocol in lowercase, either http or https.
    @property {String} authority - The username, password, host and port
    @property {String} path - The path portion of the URL
    @property {String} query - The query parameters after the question mark
    @property {String} fragment - The details after the # in the URL
    @property {String} userInfo - The username/password part of the authority
    @property {String} host - The host name
    @property {String} port - The port number or the empty string if no port
        was specified
        
 */

/* This code seems to confuse jsdoc-toolkit. */
/**#nocode+*/

function URL(url)
{
	/** The white-space timmed URL
	 *  @property {String}
	 */
	this.url= url.trim();

	// Parse the URL based on the RegExp from RFC 2396
	var pattern= (/^(([^\:\/\?#]+)\:)?(\/\/([^\/\?#]*))?([^\?#]*)(\?([^#]*))?(#(.*))?$/);
	//              12                3    4            5        6  7        8 9
	//               scheme                authority    path        query      fragment
	var match= this.url.match(pattern)||[];

	/** The protocol (typically 'http' or 'https'), or '' if not specified.
	 *  @property {String}
	 */
	this.protocol= (match[2]||"").toLowerCase();

	/** The complete authority (e.g. 'steve@mac.com:80'), or '' if not specified.
	 *  @property {String}
	 */
	this.authority= match[4]||"";

	/** The entire path between the host and port and the query string or
	 *  fragment (if any), or '' if none
	 *  @property {String}
	 */
	this.path = match[5].trim()||"";
	
	/** The query string (e.g. 'fish=red&cat=hat') after the question mark,
	 *  or '' if not specified
	 *  @property {String}
	 */
	this.query = match[7]||"";

	/** The fragment string (e.g. 'details') after the # symbol (e.g.
	 *  #details), or '' if not specified
	 *  @property {String}
	 */
	this.fragment = match[9]||"";

	// Disassemble some more useful stuff
	pattern = (/^(([^@]+)@)?([^\:]+)(:(.+))?$/);
	//           12         3       4 5
	match = this.authority.match(pattern);
	
	/** The userInfo in the URL (e.g. 'steve' in 'steve@mac.com'), or '' if not specified.
	 *  @property {String}
	 */
	this.userInfo = match[2]||"";
	
	/** The host (e.g. 'mac.com'), or '' if not specified.
	 *  @property {String}
	 */
	this.host = match[3]||"";
	
	/** The port as a string (e.g. '80'), or '' if not specified
	 *  @property {String}
	 */
	this.port = match[5]||"";
}

/**#nocode-*/