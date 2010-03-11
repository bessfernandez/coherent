/*jsl:import ValueTransformer.js*/

/** Convert a collection of strings into objects suitable for binding. This makes
    it easier to display an array of simple strings.
    
    @property {String} key - The key used to reflect the string value.
 */
coherent.transformer.StringToObject= Class.create(coherent.ValueTransformer, {

    constructor: function(key)
    {
        this.key= key||'string';
    },
    
    transformedValue: function(value)
    {
        if ('string'!==typeof(value))
            return value;
        var kvo= new coherent.KVO();
        kvo[this.key]= value;
        return kvo;
    },
    
    reverseTransformedValue: function(value)
    {
        return value && (this.key in value) ? value[this.key] : value;
    }
    
});

coherent.registerTransformerWithName(new coherent.transformer.StringToObject('string'), 'StringToObject');
