/*jsl:import ValueTransformer.js*/

/** Simple ValueTransformer that reverses the truth value of a key
 */
coherent.transformer.Not= Class.create(coherent.ValueTransformer, {

  transformedValue: function(value)
  {
    return (value?false:true);
  },
  
  reverseTransformedValue: function(value)
  {
    return (value?false:true);
  }
  
});

coherent.registerTransformerWithName(new coherent.transformer.Not(), "not");
