if (!Date.prototype.toISOString)
{
  /** Converts the current date instance into a string with an ISO 8601 format.
      The date is converted to it's UTC value.
      @type String
   */
  Date.prototype.toISOString= function()
  {
    // From http://www.json.org/json.js. Public Domain. 
    function f(n)
    {
      return n < 10 ? '0' + n : n;
    }

    return this.getUTCFullYear()   + '-' +
         f(this.getUTCMonth() + 1) + '-' +
         f(this.getUTCDate())    + 'T' +
         f(this.getUTCHours())   + ':' +
         f(this.getUTCMinutes())   + ':' +
         f(this.getUTCSeconds())   + 'Z';
  }
}

if (!Date.now)
  Date.now= function()
  {
    return (new Date()).valueOf();
  }

if (isNaN(Date.parse('2010-03-08T17:08:39Z')))
{
  Date._parse= Date.parse;
  Date.parse= function(string)
  {
    var m= /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):?(\d{2}))))?)?)?$/.exec(string);
    if (null===m)
      return Date._parse.apply(this, arguments);
    var d= new Date();
    d.setUTCFullYear(+m[1]);
    d.setUTCMonth(m[3] ? (m[3] >> 0) - 1 : 0);
    d.setUTCDate(m[5] >> 0);
    d.setUTCHours(m[7] >> 0);
    d.setUTCMinutes(m[8] >> 0);
    d.setUTCSeconds(m[10] >> 0);
    d.setUTCMilliseconds(m[12] >> 0);
    if (m[13] && m[13] !== "Z")
    {
      var h = m[16] >> 0;
      var i = m[17] >> 0;
      var s = m[15] === "+";
      d.setUTCHours((m[7] >> 0) + s ? -h : h);
      d.setUTCMinutes((m[8] >> 0) + s ? -i : i);
    }
    return d.valueOf();
  }
}
