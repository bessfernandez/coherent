/*jsl:import VIEW.js*/
/*jsl:declare VIEW_TEMPLATE*/

coherent.VIEW_TEMPLATE= function()
{
  var result= coherent.VIEW.apply(this, arguments);
  
  function templateFactory()
  {
    result.__key= templateFactory.__key;
    result.__nib= templateFactory.__nib;
    return result;
    
  }
  templateFactory.__viewTemplate__=true;
  return templateFactory;
}

coherent.__export("VIEW_TEMPLATE");