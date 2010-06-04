/*jsl:import ../data.js*/

/** Enumeration used for specifying how relations are handled when an object is
    deleted.
 */
coherent.DeleteRule= {
  NoAction: 1,
  Nullify: 2,
  Cascade: 3,
  Deny: 4
};

coherent.PropertyType= {
  Attribute: 1,
  ToOne: 2,
  ToMany: 3
};


/**
  foo: coherent.Attribute(Number),
  bar: coherent.Attribute('baz', String),
  zebra: coherent.Attribute(coherent.Color, {
                readonly: true
              })
 */

coherent.Attribute= function(remoteName, type, options)
{
  if ('string'!==typeof(remoteName))
  {
    options= type;
    type= remoteName;
    remoteName= null;
  }
  
  var prop= {
    name: remoteName,
    remoteName: remoteName,
    type: type,
    optional: true,
    indexed: true,
    readonly: false,
    'transient': false,
    defaultValue: null,
    transformer: null,
    get: getAttributeValue,
    set: setAttributeValue,
    __kind: coherent.PropertyType.Attribute
  };
  
  return Object.extend(prop, options);
}

coherent.ToOne= function(remoteName, entity, options)
{
  if ('string'!==typeof(entity))
  {
    options= entity;
    entity= remoteName;
    remoteName= null;
  }
  
  var relation= {
    name: remoteName,
    remoteName: remoteName,
    entity: entity,
    optional: true,
    indexed: true,
    readonly: false,
    'transient': false,
    inverse: null,
    deleteRule: coherent.DeleteRule.Nullify,
    maxCount: 1,
    minCount: 1,
    toMany: false,
    __kind: coherent.PropertyType.ToOne
  };
  
  return Object.extend(relation, options);
}

coherent.ToMany= function(remoteName, entity, options)
{
  if ('string'!==typeof(entity))
  {
    options= entity;
    entity= remoteName;
    remoteName= null;
  }
  
  var relation= {
    name: remoteName,
    remoteName: remoteName,
    entity: entity,
    optional: true,
    indexed: true,
    inverse: null,
    deleteRule: coherent.DeleteRule.Nullify,
    maxCount: null,
    minCount: null,
    toMany: true,
    __kind: coherent.PropertyType.ToMany
  };
  
  return Object.extend(relation, options);
}
