/*jsl:import ../core/startup.js*/
/*jsl:import ../core/local.js*/

/** Generic value formatting functionality.
 */
coherent.Formatter= Class.create({

    /** Message that will be displayed when a field has an invalid value.
        @type String
     */    
    invalidValueMessage: _('error.invalid_value'),
   
    /** Initialise a Formatter instance. This method simply copies the settings
        onto instance variables with the same name.
        @param {Object} settings - The default values to copy
     */
    constructor: function(settings)
    {
        Object.extend(this, settings);
    },

    /** Convert the value into a string.
        @param value    the data model value
        @returns {String} a string representation of the value.
     */
    stringForValue: function(value)
    {
        if (null===value || 'undefined'===typeof(value))
            return "";
        return String(value);
    },
    
    /** Convert a string into a data model representation.
        @param {String} string  the presentation value
        @returns the data model representation of the string
     */
    valueForString: function(string)
    {
        return string;
    },
    
    /** Determine whether the string represents a valid value or not.
        @param {String} string the presentation value
        @returns `true` or a {@link coherent.Error} instance indicating the
            error that should be presented to the user.
     */
    isStringValid: function(string)
    {
        return true;
    },
    
    /** Check the validity of a character before updating the field.
        @param {String} c - the new character
        @returns `true` if the character is a valid input character.
     */
    isValidInputCharacter: function(c)
    {
        return true;
    },

    /** Factory method that allows Formatters to be declaratively created. */
    __factory__: function()
    {
        var args= Array.from(arguments);
        var klass= this;
        
        function dummyConstructor(){}
        
        return function()
        {
            dummyConstructor.prototype= klass.prototype;
            var obj= new dummyConstructor();
            klass.prototype.constructor.apply(obj, args);
            return obj;
        };
    }
    
});
