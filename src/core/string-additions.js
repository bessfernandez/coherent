/** Make title case version of string.
    @returns original string with the first character capitalised.
 */
String.prototype.titleCase= function()
{
    return this.charAt(0).toUpperCase() + this.substr(1);
}

/** Trim the whitespace off either end of a string.
 */
String.prototype.trim= function()
{
    var str= this.replace(/^\s+/, '');
	for (var i = str.length - 1; i > 0; --i)
		if (/\S/.test(str.charAt(i)))
		{
			str = str.substring(0, i + 1);
			break;
		}
	return str;
}

/** Determine whether this string begins with the specified string.

    @param {String} s - The prefix to check for.
    @returns {Boolean} True if this string begins with the specified string.
 */
String.prototype.beginsWith= function(s)
{
    return s===this.substring(0, s.length);
}

if (!String.prototype.localeCompare)
{
    /** Not all browsers implement localeCompare. This probably will be slow.
        @param {String} other - The other string to compare against.
        @return {Number} -1,0, or 1 depending on the sort order
     */
    String.prototype.localeCompare = function(other)
    {
        if (this < other)
            return -1;
        else if (this > other)
            return 1;
        else
            return 0;
    }
}

/** Expand variables within this string. This method uses the UNIX shell
    expansion syntax: "This is ${var1}." The properties of the `obj` parameter
    are used to determine the values to insert into the string.
    
    @param {Object} obj - The object from which the values for variables will be
           taken.
    @param {String} [defaultValue] - The default value to insert when a variable
           is not found in `obj`.
    @returns {String} A new string with variables expanded to have the values
             specified in `obj`.
*/
String.prototype.expand = function(obj, defaultValue)
{
    function lookupKey(str, key)
    {
        var value= obj[key];
        if (null===value || 'undefined'===typeof(value))
            return defaultValue;
        return value;
    }

    return this.replace(/\$\{(\w+)\}/g, lookupKey);
}

