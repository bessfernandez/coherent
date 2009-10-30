/*jsl:import Formatter.js*/

coherent.NumberFormatter= Class.create(coherent.Formatter, {

    invalidValueMessage: _('error.invalid_number'),
    
    validFloatCharacters: '0123456789.-',
    validIntCharacters: '0123456789-',
    
    allowsFloats: true,
    allowEmptyString: false,
    
    stringForValue: function(value)
    {
        if (null===value || 'undefined'===typeof(value))
            return "";
        return String(value);
    },
    
    valueForString: function(string)
    {
        string= string.trim();
        if (this.allowsFloats)
            return parseFloat(string);
        else
            return parseInt(string, 10);
    },
    
    /** Return true or a coherent.Error instance indicating the error that
        should be presented to the user.
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
     */
    isValidInputCharacter: function(c)
    {
        if (this.allowsFloats)
            return (-1!==this.validFloatCharacters.indexOf(c));
        else
            return (-1!==this.validIntCharacters.indexOf(c));
    }
    
});