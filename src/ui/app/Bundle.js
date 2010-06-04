coherent.Bundle= Class._create({

    constructor: function(name)
    {
        this.name= name;
    },
    
    pathForResource: function(resource)
    {
        return distil.urlForAssetInModule(resource, this.name);
    }
    
});

coherent.Bundle.mainBundle= new coherent.Bundle(null);
