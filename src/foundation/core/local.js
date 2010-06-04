/*jsl:import base.js*/

/** Localised marker strings used by various views
    @namespace
 */
coherent.strings= {

  //  Marker strings for TextField
  'marker.input.multipleValues': 'Multiple Values',
  'marker.input.placeholder': '',
  'marker.input.noSelection': 'No Selection',
  
  //  Marker strings for View
  'marker.text.multipleValues': 'Multiple Values',
  'marker.text.placeholder': '',
  'marker.text.noSelection': 'No Selection',
  
  //  Default Error description
  'error.no_description': 'An unspecified error occurred.',
  
  //  Default Error description for Formatters
  'error.invalid_value': 'This value is not valid.',
  'error.invalid_number': 'This value is not a valid number.'
};

/** Return the localised string for the given key. If the key is not present in
    the {@link coherent.strings} namespace, this function will just return the
    key itself.
 */
coherent.localisedString= function(key)
{
  return {
    toString: function()
    {
      if (key in coherent.strings)
        return coherent.strings[key];
      console.log('Localisation missing string for key: ' + key);
      return key;
    },
    toJSON: function()
    {
      return this.toString();
    }
  };
}

/** An alias of {@link coherent.localisedString} which is rather shorter to
    type. This mimics a fairly common localisation function pattern.
  
    @function
    @public
    @param {String} key - The string key that should be looked up and returned.
    @returns {String} The localised version of the string or the key itself.
 */
var _= coherent.localisedString;
