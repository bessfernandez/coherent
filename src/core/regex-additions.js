/** A function to escape strings for creating regular expressions.
    @param {String} text - the text to convert into a valid regular expression
    @type String
 */
RegExp.escape = function(text)
{
  return text.replace(RegExp._escapeRegex, '\\$1');
}
/** The special characters in a string that need escaping for regular expressions. */
RegExp.specialCharacters= ['/', '.', '*', '+', '?', '|',
                           '(', ')', '[', ']', '{', '}', '\\'];
/** A regular expression that will match any special characters that need to be
    escaped to create a valid regular expression. */
RegExp._escapeRegex= new RegExp('(\\'+ RegExp.specialCharacters.join("|\\") +
                                ')', 'g');
