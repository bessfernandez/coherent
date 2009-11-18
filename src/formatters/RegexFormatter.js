/*jsl:import Formatter.js*/

/** A formatter that matches input against regular expressions.
 */
coherent.RegexFormatter= Class.create(coherent.Formatter, {

    /** Create a new RegexFormatter. This formatter doesn't actually format the
        value, but it uses a series of regular expressions to determine the
        validity of the value.
        
        @param {RegExp|String} settings.validCharacters - either a regular
            expression or a string defining the valid characters for this
            formatter.
        @param {RegExp|RegExp[]} settings.validRegex - either a regular
            expression or an array of regular expressions that determine whether
            a value is valid.
        @param {RegExp|RegExp[]} settings.invalidRegex - either a regular
            expression or an array of regular expressions that determine whether
            the value is invalid.
    */
    constructor: function(settings)
    {
        this.base(settings);
        this.typeofValidCharacters= typeof(this.validCharacters);
        
        //  convert single regexes to an array with just one element
        if (this.invalidRegex && 'exec' in this.invalidRegex)
            this.invalidRegex= [this.invalidRegex];
        if (this.validRegex && 'exec' in this.validRegex)
            this.validRegex= [this.validRegex];
    },
    
    /** Return true or a coherent.Error instance indicating the error that
        should be presented to the user.
     */
    isStringValid: function(string)
    {
        var i;
        var len;
        var regexList;
        
        function testRegex(regex)
        {
            return regex.test(string);
        }
        
        if (!(this.invalidRegex && this.invalidRegex.some(testRegex)) &&
            (this.validRegex && this.validRegex.some(testRegex)))
            return true;
                    
        return new coherent.Error({
                        description: this.invalidValueMessage
                    });
    },
    
    /** Return true if the character is a valid input character.
     */
    isValidInputCharacter: function(c)
    {
        if (!this.validCharacters)
            return true;
            
        if ('string'===this.typeofValidCharacters)
            return (-1!==this.validCharacters.indexOf(c));
        else
            return this.validCharacters.test(c);
    }

});