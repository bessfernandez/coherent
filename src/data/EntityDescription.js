/*jsl:import ManagedObject.js*/

/** A description of a managed object entity.

    @property {String} name
    The name of the entity. This is used for creating instances and mapping IDs
    to ManagedObjectIds.
    
    @property {Class} managedObjectClass
    If specified, this should be a subclass of {@link coherent.ManagedObject}
    that will be used to create instances of this entity.
 */
coherent.EntityDescription= Class.create({

    managedObjectClass: null,
    
    constructor: function(name, schema)
    {
        this.name= name;
        if ('managedObjectClass' in schema)
        {
            this.managedObjectClass= schema.managedObjectClass;
            delete schema.managedObjectClass;
        }
        if ('superEntity' in schema)
        {
            this.superEntity= schema.superEntity;
            delete schema.superEntity;
        }
        this.schema= schema;

        //  Stash the property name
        for (var p in schema)
            schema[p].name= p;
            
        coherent.EntityDescription.__entities[name]= this;
    },
    
    setup: function()
    {
        if (this.__setup)
            return;
        
        this.__setup= true;
            
        var schema= this.schema;
        var superEntity;
        
        if (this.superEntity)
        {
            superEntity= coherent.EntityDescription.__entities[this.superEntity];
            superEntity.setup();
            
            Object.applyDefaults(schema, superEntity.schema);
        }
        
        var klass= this.managedObjectClass;
        
        //  lookup the managedObjectClass
        if ('string'===typeof(klass))
            klass= Object.get(klass);
        else if (!klass)
            klass= superEntity ? superEntity.managedObjectClass : coherent.ManagedObject;
            
        //  create the subclass
        klass= Class.create(klass, {});
        
        var proto= klass.prototype;
        var propertyDef;
        var setterName;
        var propertyType;
        
        for (var p in schema)
        {
            propertyDef= schema[p];
            switch (propertyDef.__kind)
            {
                case propertyType.Attribute:
                    if (!(propertyDef.name in proto))
                        Class.addMember(proto, p, this._createAttributeGetter(propertyDef));
                    setterName= 'set' + p.titleCase();
                    if (!propertyDef.readonly && !(setterName in proto))
                        Class.addMember(proto, setterName, this._createAttributeSetter(propertyDef));
                    break;
                
                case propertyType.ToOne:
                    if (!(propertyDef.name in proto))
                        Class.addMember(proto, p, this._createToOneRelationGetter(propertyDef));
                    setterName= 'set' + p.titleCase();
                    if (!propertyDef.readonly && !(setterName in proto))
                        Class.addMember(proto, setterName, this._createToOneRelationSetter(propertyDef));
                    break;
                
                case propertyType.ToMany:
                    // @TODO finish this
                    break;
                    
                default:
                    throw new Error('unknown recognised schema entry:' + propertyDef.name);
            }
        }
        
        this.managedObjectClass= klass;
        
    },

    _createAttributeGetter: function(propertyDef)
    {
        function getter()
        {
            return this.primitiveValueForKey(getter.propertyDef.name);
        }
        getter.displayName= propertyDef.name;
        getter.propertyDef= propertyDef;
        return getter;
    },

    _createAttributeSetter: function(propertyDef)
    {
        function setter(newValue)
        {
            return this.setPrimitiveValueForKey(newValue, setter.propertyDef.name);
        }
        setter.displayName= 'set' + propertyDef.name.titleCase();
        setter.propertyDef= propertyDef;
        return setter;
    },

    _createToOneRelationGetter: function(propertyDef)
    {
        function getter()
        {
            if (getter.internalName in this)
                return this[getter.internalName];
        
            var primaryKey= this.primitiveValueForKey(getter.propertyDef.name);
            var objectId= new coherent.ManagedObjectId(this.propertyDef.entity, 
                                                       primaryKey);
            //  return the object or a fault that will become the object
            return (this[getter.internalName]= this.managedObjectContext.objectWithId(objectId));
        }
        getter.displayName= propertyDef.name;
        getter.propertyDef= propertyDef;
        getter.internalName= "__" + propertyDef.name;
    
        return getter;
    },

    _createToOneRelationSetter: function(propertyDef)
    {
        function setter(newValue)
        {
            var propertyDef= setter.propertyDef;
            var obj;
        
            //  deal with the previous value
            if (setter.internalName in this)
            {
                obj= this[setter.internalName];
            
            }
        
            if (!newValue.isInserted())
            {
                var objectId= newValue.objectId();
            }
        
            //  There's a previous value
            if (setter.internalName in this)
            {
                obj= this[setter.internalName];
            }
        }
        setter.displayName= 'set' + propertyDef.name.titleCase();
        setter.propertyDef= propertyDef;
        setter.internalName= "__" + propertyDef.name;
        return setter;
    }

});

