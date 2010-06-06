/*jsl:import ../../ui.js*/

coherent.Bundle= Class._create({

  constructor: function(name)
  {
    this.name= name;
    this.nibs= {};
  },
  
  pathForResource: function(resource)
  {
    return distil.urlForAssetWithNameInModule(resource, this.name);
  }
  
});

coherent.Bundle.mainBundle= new coherent.Bundle(null);
coherent.Bundle.__current= coherent.Bundle.mainBundle;