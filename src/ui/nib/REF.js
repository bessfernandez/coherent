/*jsl:import ../../ui.js*/
/*jsl:declare REF*/

coherent.REF = function(reference)
{
  var separatorIndex= reference.indexOf(' ');
  var ref= {
    resolve: coherent.REF.resolve
  };
  
  if (-1!==separatorIndex)
  {
    ref.childReference= reference.substring(separatorIndex+1);
    ref.reference= reference.substring(0, separatorIndex);
  }
  else
    ref.reference= reference;
  
  coherent.REF.__unresolved.push(ref);  
  
  var referenceFunction= function()
  {
    var ref= referenceFunction.ref;
    ref.key= referenceFunction.__key;
    ref.owner= this;
    
    return null;
  };
  referenceFunction.ref= ref;
  referenceFunction.__factoryFn__= true;
  return referenceFunction;
};

coherent.REF.__unresolved= [];
coherent.REF.resolve= function(context)
{
  var object= context.valueForKey(this.reference);
  if (object && this.childReference)
    object= (object.__resolveChildReference||object.valueForKeyPath).call(object, this.childReference);

  if (!object)
    throw new Error("Unable to resolve NIB reference: "+ [this.reference, this.childReference].join(' '));

  var setter= 'set' + this.key.titleCase();
  if (setter in this.owner)
    this.owner[setter](object);
  else
    this.owner[this.key]= object;
}

coherent.__export("REF");
