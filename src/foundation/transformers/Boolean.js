/*jsl:import ValueTransformer.js*/

/** ValueTransformer that returns true only for a particular value.
 */
coherent.transformer.Boolean= Class.create(coherent.ValueTransformer, {

  constructor: function(trueValue, falseValue)
  {
    this.trueValue= trueValue;
    this.falseValue= falseValue;
  },
  
  transformedValue: function(value)
  {
    return (value==this.trueValue);
  },
  
  reverseTransformedValue: function(value)
  {
    return (value?this.trueValue:this.falseValue);
  }

});
