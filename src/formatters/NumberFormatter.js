/*jsl:import Formatter.js*/

/** Instances of coherent.NumberFormatter are responsible for formatting and
    validating numeric data for views. The numeric data can be either integers
    or floating point values.
    
    Using {@link #valueForEmptyString} it is possible to specify a default value
    to use when the string value is empty. The default value of
    {@link #allowsEmptyString} is `false`, so an empty string value is
    considered invalid.
 */
coherent.NumberFormatter= Class.create(coherent.Formatter, {

    invalidValueMessage: _('error.invalid_number'),
    
    /** The valid characters for floating point numbers.
        @type String
        @default '0123456789.-'
     */
    validFloatCharacters: '0123456789.-',
    
    /** The valid characters for integer numbers.
        @type String
        @default '0123456789-'
     */
    validIntCharacters: '0123456789-',
    
    /** Should the field allow floating point numbers?
        @type Boolean
        @default true
     */
    allowsFloats: true,
    
    /** Should the field allow empty strings?
        @type Boolean
        @default false
     */
    allowsEmptyString: false,

    /** What value should be used when the input is an empty string?
        @type Number
        @default 0
     */
    valueForEmptyString: 0,
    
    /** Return the string representation of the value. If floating point values
        are not permitted, this method will round the number to the nearest
        integer.
        
        @param [Number] value - the number to convert to a string
        @returns {String} the string representation.
     */
    stringForValue: function(value)
    {
        if (null===value || 'undefined'===typeof(value))
            return "";
        if (!this.allowFloats)
            value= Math.round(value);
        return String(value);
    },

    /** Return the number value of the string.
        @param {String} string - the string to convert into a number
        @returns {Number} the numeric value
     */
    valueForString: function(string)
    {
        string= string.trim();
        if (!string && this.allowsEmptyString)
            return this.valueForEmptyString;
            
        if (this.allowsFloats)
            return parseFloat(string);
        else
            return parseInt(string, 10);
    },
    
    /** Return true or a {@link coherent.Error} instance indicating the error
        that should be presented to the user.
        @param {String} string - the string to validate
        @return {Boolean} `true` if the string is a valid value
        @return {coherent.Error} An error when the string is not a number
     */
    isStringValid: function(string)
    {
        string= string.trim();
        if (!string && this.allowEmptyString)
            return true;
    
        var val= this.valueForString(string);
        var OK= !isNaN(val);
        
        //  If val is a number, check against min & max
        if (OK && !isNaN(this.minimum))
            OK= (val >= this.minimum);
        
        if (OK && !isNaN(this.maximum))
            OK= (val <= this.maximum);

        if (OK)
            return true;
            
        return new coherent.Error({
                        description: this.invalidValueMessage
                    });
    },
    
    /** Return true if the character is a valid input character.
        @param {String} c - the character to test
        @type Boolean
     */
    isValidInputCharacter: function(c)
    {
        if (this.allowsFloats)
            return (-1!==this.validFloatCharacters.indexOf(c));
        else
            return (-1!==this.validIntCharacters.indexOf(c));
    }
    
});