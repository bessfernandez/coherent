/** @class
  @name Object
 */

Object.applyDefaults(Object, {

  keys: function(object)
  {
    var keys= [];
    for (var k in object)
      if (object.hasOwnProperty(k))
        keys.push(k);
    return keys;
  },

  /** @name Object.getPrototypeOf
      @function
      @description Determine the prototype for a specific object
      @type Object
      @param {Object} object - The object to retrieve the prototype of
   */
  getPrototypeOf: (('object'===typeof('test'.__proto__)) ?
                    function(object)
                    {
                      return object.__proto__;
                    }
                  :
                    function(object)
                    {
                      return object.constructor.prototype;
                    }
                  )
          
});
