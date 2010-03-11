/*jsl:import ValueTransformer.js*/

/** Return the first object in a collection.
 */
coherent.transformer.FirstObject= Class.create(coherent.ValueTransformer, {
    transformedValue: function(array)
    {
        if ('array'!==coherent.typeOf(array))
            return array;
            
        return array[0];
    }
});
