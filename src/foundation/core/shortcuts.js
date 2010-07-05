/*jsl:import base.js*/

coherent.__original= {};
coherent.__export= function(name, value)
{
  var original= coherent.__original;
  var global= coherent.global;
  
  value= value||coherent[name];
  
  original[name]= global[name];
  console.log('original.'+name+'= ', global[name]);
  global[name]= value;
}

coherent.noConflict= function()
{
  var global= coherent.global;
  var original= coherent.__original;
  var value;
  
  for (var s in original)
  {
    console.log('resetting window.'+s+'= ', original[s]);
    value= original[s];
    if ('undefined'===typeof(value))
      delete global[s];
    else
      global[s]= original[s];
  }
}
