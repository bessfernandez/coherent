/** @class
    @name Object
 */

if (!Object.keys)
    Object.keys= function(object)
    {
        var keys= [];
        for (var k in object)
            keys.push(k);
        return keys;
    }

/** @name Object.getPrototypeOf
    @function
    @description Determine the prototype for a specific object
    @type Object
    @param {Object} object - The object to retrieve the prototype of
 */
if (!Object.getPrototypeOf)
{
    if ('object'===typeof('test'.__proto__))
        Object.getPrototypeOf= function(object)
        {
            return object.__proto__;
        }
    else
        Object.getPrototypeOf= function(object)
        {
            return object.constructor.prototype;
        }
}
