coherent.Model.ClassMethods= {

  uniqueId: 'id',
  
  add: function(model)
  {
    if (-1!==this.collection.indexOf(model))
      return;
    this.collection.push(model);
  },

  all: function()
  {
    return this.collection.slice();
  },
  
  count: function()
  {
    return this.collection.length;
  },
  
  find: function(id)
  {
    var all= this.collection;
    
    if ('function'===typeof(id))
    {
      var index= all.find(id);
      return -1===index ? null : all[index];
    }
      
    var len= all.length;
    for (var i=0; i<len; ++i)
      if (all[i].id()==id)
        return all[i];
        
    return null;
  },
  
  forEach: function(iterator)
  {
    this.collection.forEach(iterator);
  },

  map: function(fn)
  {
    return this.collection.map(fn);
  },
  
  remove: function(model)
  {
    this.collection.removeObject(model);
  },
  
  sort: function(sortFunction)
  {
    return this.collection.slice().sort(sortFunction);
  },
  
  uids: function()
  {
    return this.collection.map(function(model) { return model.__uid; });
  }
  
};