/*jsl:import VIEW.js*/
/*jsl:declare VIEW_TEMPLATE*/

coherent.VIEW_TEMPLATE= function()
{
  var result= coherent.VIEW.apply(this, arguments);
  
  function templateFactory()
  {
    return result;
  }
  templateFactory.__viewTemplate__=true;
  return templateFactory;
}

coherent.__export("VIEW_TEMPLATE");