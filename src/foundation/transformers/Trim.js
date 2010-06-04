/*jsl:import ValueTransformer.js*/

/** Return a string value that has whitespace at the beginning and end removed.
    This will also optionally compress whitespace within the value. Compressing
    the whitespace is important because whitespace is not significant in HTML
    display. By compressing it, you can recognise values that differ only via
    whitespace, but which will appear the same.
  
    @property {Boolean} compressWhitespace - Should whitespace be compressed?
 */
coherent.transformer.Trim= Class.create(coherent.ValueTransformer, {

  compressWhitespace: false,
  
  transformedValue: function(value)
  {
    if ('string'!==typeof(value))
      return value;
    if (this.compressWhitespace)
      return value.trim().replace(/\s+/g, ' ');
    return value.trim();
  },
  
  reverseTransformedValue: function(value)
  {
    if ('string'!==typeof(value))
      return value;
    if (this.compressWhitespace)
      return value.trim().replace(/\s+/g, ' ');
    return value.trim();
  }
  
});

coherent.registerTransformerWithName(new coherent.transformer.Trim(), "trim");
