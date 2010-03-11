/*jsl:import ValueTransformer.js*/

/** A transformer that maps between two lists of values.
 */
coherent.transformer.Generic= Class.create(coherent.ValueTransformer, {

    constructor: function(modelValues, displayValues)
    {
        this.modelValues= modelValues;
        this.displayValues= displayValues;
    },
    
    transformedValue: function(value)
    {
        var index= this.modelValues.indexOf(value);
        var novalue;
        
        if (-1==index)
            return novalue;
        else
            return this.displayValues[index];
    },
    
    reverseTransformedValue: function(value)
    {
        var index= this.displayValues.indexOf(value);
        var novalue;
        
        if (-1==index)
            return novalue;
        else
            return this.modelValues[index];
    }
    
});
