/*jsl:import ValueTransformer.js*/

/** Truncate a string value at a specific length.
    @property {Number} max - maximum length of the string value before it will
        be truncated.
 */
coherent.transformer.Truncate= Class.create(coherent.ValueTransformer, {

    constructor: function(max)
    {
        this.max= max || 50;
    },
    
    ellipsis: String.fromCharCode(0x2026),
    
    transformedValue: function(value)
    {
        if (!value && 0!==value)
            return value;

        value= "" + value;
        var len= value.length;
        if (len<=this.max)
            return value;

        //  Perform the ellipsis trick
        var half= this.max/2-2;
    
        //  Have to use Unicode character rather than entity because otherwise this
        //  won't work as a text binding.
        return [value.substr(0, half), this.ellipsis, value.substr(len-half)].join(' ');
    }
    
});

coherent.registerTransformerWithName(new coherent.transformer.Truncate(50), "truncated");
