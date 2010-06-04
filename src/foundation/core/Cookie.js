/*jsl:import ../../foundation.js*/
/*jsl:declare JSON*/

/** Cookie support.
*/
var Cookie = Class.create(coherent.KVO, {

  /** Create a wrapper for the cookie with the given name. The new Cookie
      object will immediately retrieve the value of the cookie if it exists.
    
      @param {String} name  The name of the cookie object.
      @param {Object} [options] A hash of options specifying the expiry,
           path, domain and whether the cookie should be limited to SSL.
           These options become the default values used when setting a new
           value for the cookie.
      @param {Number|Date} [options.expires] If a number, this parameter
           specifies the number of days before the cookie expires. When a
           date is specified, the cookie will be set to expire on that
           date.
      @param {String} [options.path] This specifies the root path within which
           the cookie will appear. A cookie set with path /foo/bar will be
           sent to the server when it accesses /foo/bar/baz, but not when
           accessing the URL /foo.
      @param {String} [options.domain] The domain within which the cookie is
           valid. If the visitor has loaded `http://cookie.example.com/`,
           the cookie may be shared with `http://cake.example.com/` by
           setting the domain to `example.com`.
      @param {Boolean} [options.secure] When set to `true`, the client will
           only send the cookie to the server when the connection is secured
           by SSL.
   **/
  constructor: function(name, options)
  {
    var c = document.cookie;

    this.name= name;
    this.options= options;
    
    var index = c.lastIndexOf(name+'=');
    if (-1!==index)
    {
      var start= index+name.length+1;
      var end= c.indexOf(';', start);
      
      if (-1===end)
        end=c.length;
      this.__value= decodeURIComponent(c.slice(start, end).replace(/\+/g, '%20'));
    }
    else
      this.__value= "";
  },

  /** Retrieve the present value of the cookie.
      @returns {String} the value of the cookie.
   */
  getValue: function()
  {
    return this.__value;
  },
  
  /** Set the value of the cookie.
      @param {String} newValue  The new value of the cookie.
      @param {Object} [options] A hash of options specifying the expiry,
           path, domain and whether the cookie should be limited to SSL.
      @param {Number|Date} [options.expires] If a number, this parameter
           specifies the number of days before the cookie expires. When a
           date is specified, the cookie will be set to expire on that
           date.
      @param {String} [options.path] This specifies the root path within which
           the cookie will appear. A cookie set with path /foo/bar will be
           sent to the server when it accesses /foo/bar/baz, but not when
           accessing the URL /foo.
      @param {String} [options.domain] The domain within which the cookie is
           valid. If the visitor has loaded `http://cookie.example.com/`,
           the cookie may be shared with `http://cake.example.com/` by
           setting the domain to `example.com`.
      @param {Boolean} [options.secure] When set to `true`, the client will
           only send the cookie to the server when the connection is secured
           by SSL.
   */         
  setValue: function(newValue, options)
  {
    options= Object.applyDefaults(options, this.options);

    newValue= encodeURIComponent(newValue);
    this.__value= newValue;
    
    if ('number'===typeof(options.expires))
      options.expires= new Date(new Date().valueOf() + options.expires*24*60*60*1000);
    
    document.cookie= this.name + '=' + newValue + 
             (options.expires ? "; expires=" + options.expires.toUTCString() : "") +
             (options.path ? "; path=" + options.path : "") +
             (options.domain ? "; domain=" + options.domain : "") +
             (options.secure ? "; secure" : "");
  },
  
  /** Delete the cookie. The cookie is set to expire immediately.
   */
  clear: function()
  {
    this.setValue("", {
        expires: new Date(0)
      });
  },

  /** Convert the value of the cookie from a JSON encoded object into a real
      object.
      @returns {Object} the result of parsing the cookie value using the JSON
           encoding.
         
      @TODO: this needs to be converted to a KVO object that tracks changes and
      automatically updates the cookie. Otherwise, you'll need to call save to
      persist changes.
   **/
  getObjectValue: function()
  {
    if (!this.__value)
      return {};
      
    if (!this.__objectValue)
      this.__objectValue= JSON.parse(this.__value);
    return this.__objectValue;
  },
  
  /** Set the cookie value to a JSON encoded string representation of the
      specified object.
      @param {Object} newObject The object to serialise and store in the
           cookie. This object should not have any cycles or the serialisation
           will fail.
      @param {Object} [options] See the options for {@link #setValue}
   */
  setObjectValue: function(newObject, options)
  {
    this.__objectValue= newObject;
    this.setValue(JSON.stringify(newObject), options);
  }
});

if (window.Cookie!==Cookie)
  window.Cookie= Cookie;