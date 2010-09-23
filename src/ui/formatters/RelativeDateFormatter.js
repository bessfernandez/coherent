/*jsl:import Formatter.js*/

/** Instances of coherent.RelativeDateFormatter are responsible for formatting
    dates using a relative value: e.g. 5 minutes ago.
 */
coherent.RelativeDateFormatter= Class.create(coherent.Formatter, {

  /** Return the string representation of the value.
    
      @param [Date|String] value - the date to convert to a relative string
      @returns {String} the string representation.
   */
  stringForValue: function(value)
  {
    if (null===value || 'undefined'===typeof(value))
      return "";

    // Calculate difference between date and now
    var today = Math.floor((new Date()).getTime() / 1000);
    var date = Math.floor((new Date(value)).getTime() / 1000);
    var second_difference = today - date;
    var day_difference = Math.floor(second_difference / 86400);
    var when_text, one_off;

    // Determine if date is in future or past
    if (second_difference < 0)
    {
      when_text = ' from now';
      one_off = 'Tomorrow';
      second_difference = -second_difference;
      day_difference = -day_difference;
    } 
    else
    {
      one_off = 'Yesterday';
      when_text = ' ago';
    }

    // Return relative string
    if (day_difference === 0)
    {
      if (second_difference < 60)
        return 'Just now';
      else if (second_difference < 120)
        return '1 minute' + when_text;
      else if (second_difference < 3600)
        return Math.floor(second_difference/60) + ' minutes' + when_text;
      else if (second_difference < 7200)
        return '1 hour' + when_text;
      else if (second_difference < 86400)
        return Math.floor(second_difference/3600) + ' hours' + when_text;
    }
    else if (day_difference == 1)
      return one_off;
    else if (day_difference < 7)
      return day_difference + ' days' + when_text;
    else if (day_difference == 7)
      return '1 week' + when_text;
    else if (day_difference < (7*6))
      return Math.ceil(day_difference/7) + ' weeks' + when_text;
    else if (day_difference < 365)
      return Math.ceil(day_difference/(365/12)) + ' months' + when_text;
    else
    {
      var years = Math.round(day_difference/365);
      return years + ' year' + (years != 1 ? 's' : '') + when_text;
    }
  }

});