/** Generate an array containing the values between begin and end. When called
    with only one parameter, the parameter should be an array, and IndexRange
    will return another array with each index of the array.
    
    @param {Number|Array} begin - the first value or an array
    @param {Number} [end] - the final value
    @returns {Array} an array containing numbers between begin and end.
 */
function IndexRange(begin, end)
{
    var i;
    var r=[];

    if (1==arguments.length && begin.length)
    {
        end= begin.length-1;
        begin= 0;
    }

    if (begin>end)
    {
        var tmp= end;
        end= begin;
        begin= tmp;
    }
    for (i=begin; i<=end; ++i)
        r.push(i);
    return r;
}
