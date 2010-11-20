describe("coherent.Model", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
    this.model= Model("foo", {});
  });
  
  it("should exist", function() {
    expect(coherent.Model).not.toBeNull();
  });
  
  it("should be available by alias Model", function() {
    expect(Model).not.toBeNull();
    expect(Model).toEqual(coherent.Model);
  });
  
  it("should be create a new Model", function() {
    expect(this.model).not.toBeNull();
  });
  
  it("should return a subclass of coherent.ModelObject", function() {
    expect(this.model.superclass).toBe(coherent.ModelObject);
  });

  it("should create instances derived from coherent.ModelObject", function() {
    var object= new this.model();
    expect(object).toBeInstanceOf(coherent.ModelObject);
    expect(object).toHaveProperty('valueForKey');
    expect(object).toHaveProperty('setValueForKey');
    expect(object.setValueForKey).toBeInstanceOf(Function);
  });
  
  describe("with typed property declarations", function() {
  
    it("should create getter & setter", function() {
      var model= Model("typed", {
    
        zebra: String
      
      });
    
      var object= new model();
      expect(object).toHaveMethod('zebra');
      expect(object).toHaveMethod('setZebra');
      var info= object.infoForKey('zebra');
      expect(info).toHaveProperty('type');
      expect(info.type).toBe(String);
    });
  
    it("should check type when setting typed property", function() {
      var model= Model("typed", {
    
        zebra: String
      
      });
    
      var object= new model();
      function testInvalidType()
      {
        object.setValueForKey(123, 'zebra');
      }
      expect(testInvalidType).toThrow("Invalid type for zebra");
    });
    
    it("should convert date from strings", function() {
      
      var model= Model("WithDate", {
      
        created: Date
        
      });

      var object= new model({
        created: "1971-08-06T07:41-08:00"
      });
      expect(object).toHaveProperty('created');
      expect(object.created()).toBeInstanceOf(Date);
      expect(object.created().valueOf()).toBe(Date.parse("1971-08-06T07:41-08:00"));
    });
    
    it("should create instances of typed properties", function() {
      var model1= Model("A", {
        zebra: String
      });
      
      var model2= Model("B", {
        fish: model1
      });
      
      var object= new model2({
        fish: {
          zebra: "ABC"
        }
      });
      expect(object).toHaveProperty('fish');
      expect(object.fish()).toBeInstanceOf(model1);
    });
  });
  
  describe("instances", function() {

    it("should initialise values", function() {
      var object= new this.model({ abc: 123 });
      expect(object).not.toHaveProperty('abc');
      expect(object.valueForKey('abc')).toBe(123);
    });
  
    it("should be created with empty changes", function() {
      var object= new this.model({ abc: 123 });
      expect(Object.keys(object.changes).length).toBe(0);
    });
  
    it("should set values via setValueForKey", function() {
      var object= new this.model();

      object.setValueForKey(123, 'abc');
      expect(object.valueForKey('abc')).toBe(123);
    });

    it("should not set values for immutable properties", function() {
      var model= Model("immutable", {
        zebra: function()
        {
          return 123;
        }
      });
      
      var object= new model();
      object.setValueForKey(567, 'zebra');
      expect(object.valueForKey('zebra')).not.toBe(567);
    });
    
    it("should fire change notifications", function() {
      var object= new this.model();
      var observer= new TestObserver();
      
      object.addObserverForKeyPath(observer, 'observeChange', 'abc');
      object.setValueForKey(123, 'abc');
      expect(observer.called).toBe(true);
    });

    it("should fire change notifications for custom setter methods", function() {
      var M= Model("CustomSetter", {
        foo: function()
        {
          return this.primitiveValueForKey('foo');
        },
        
        setFoo: function(value)
        {
          return this.setPrimitiveValueForKey(value, 'foo');
        }
      });
      
      var object= new M();
      var observer= new TestObserver();
      object.addObserverForKeyPath(observer, 'observeChange', 'foo');
      object.setFoo('bar');
      expect(observer.called).toBe(true);
    });
    
    
    it("can be added to the Model's collection", function() {
      var object= new this.model();
      this.model.add(object);
      expect(this.model.collection).toContain(object);
      expect(this.model.all()).toContain(object);
      expect(this.model.count()).toBe(1);
    });
    
    it("can only be added to the Model's collection once", function() {
      var object= new this.model();
      this.model.add(object);
      this.model.add(object);
      expect(this.model.collection).toContain(object);
      expect(this.model.collection.length).toBe(1);
    });
    
    it("can be found by ID", function() {
      var object1= new this.model({ id: 'foo' });
      var object2= new this.model({ id: 'bar' });
      this.model.add(object1);
      this.model.add(object2);
      expect(this.model.find("bar")).toBe(object2);
      expect(this.model.find("foo")).toBe(object1);
    });
    
    it("can be found by predicate", function() {
      var object1= new this.model({ name: 'foo' });
      var object2= new this.model({ name: 'bar' });
      this.model.add(object1);
      this.model.add(object2);
      function makeFindByName(name)
      {
        return function(obj)
        {
          return obj.valueForKey('name')==name;
        }
      }
      
      expect(this.model.find(makeFindByName('bar'))).toBe(object2);
      expect(this.model.find(makeFindByName("foo"))).toBe(object1);
    });
  });
  
  describe("properties", function() {
    it("should allow declaring properties", function() {

      var M= Model("HasProperty", {
      
        foo: Model.Property({
              type: String,
              set: function(value)
              {
                this.setPrimitiveValueForKey(String(value).toUpperCase(), 'foo');
              },
              get: function()
              {
                return this.primitiveValueForKey('foo');
              }
            })
      });
      
      var obj= new M();
      expect(obj).toHaveMethod('foo');
      expect(obj).toHaveMethod('setFoo');
      obj.setFoo('bar');
      expect(obj.foo()).toBe('BAR');
    });
    
    it("should fire change notifications when setting properties", function() {
      var M= Model("HasProperty", {
        foo: Model.Property({
              type: String
            })
      });
    
      var obj= new M();
      var observer= new TestObserver();
      obj.addObserverForKeyPath(observer, 'observeChange', 'foo');
      obj.setFoo('zebra');
      expect(observer.called).toBe(true);
    });
    
    it("should fire change notifications when calling custom setter method", function() {
      var M= Model("HasProperty", {
      
        foo: Model.Property({
              type: String,
              get: function()
              {
                return this.primitiveValueForKey('foo');
              },
              set: function(value)
              {
                this.setPrimitiveValueForKey(value, 'foo');
              }
            })
      });
      
      var obj= new M();
      var observer= new TestObserver();
      obj.addObserverForKeyPath(observer, 'observeChange', 'foo');
      obj.setFoo('zebra');
      expect(observer.called).toBe(true);
    });
  });
  
  describe("uid collection", function() {
    it("should start empty", function() {
      var M= Model("Bogus", {});
      expect(M.uids()).toBeEmpty();
    });
    
    it("should include added objects", function() {
      var object= new this.model();
      this.model.add(object);
      expect(this.model.uids()).toContain(object.__uid);
    });
  });
});