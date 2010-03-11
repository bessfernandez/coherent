/*jsl:import ValueTransformer.js*/

/** ValueTransformer that returns true only for values matching a regex
 */
coherent.transformer.Matches= Class.create(coherent.ValueTransformer, {

    constructor: function(trueRegex)
    {
        this.trueRegex= trueRegex;
    },
    
    transformedValue: function(value)
    {
        return this.trueRegex.test(value);
    }

});
