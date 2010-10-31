
describe("Class", function() {

  it("will call constructor when created", function() {

    var called= false;
  
    var MyClass= Class.create({
      
      constructor: function()
      {
        called= true;
      }
  
    });
  
    var c= new MyClass();
    expect(called).toEqual(true);
        
  });


  it("can pass arguments to constructor", function() {

    var numberOfArguments= 0;
  
    var MyClass= Class.create({
      
      constructor: function()
      {
        numberOfArguments= arguments.length;
      }
  
    });
  
    var c= new MyClass(5,1);
    expect(numberOfArguments).toEqual(2);
        
  });

    
  describe("derived from another class", function() {
  
  
    it("will call base class constructor when created", function() {
    
      var baseCalled= false;
      
      var BaseClass= Class.create({

        constructor: function()
        {
          baseCalled= true;
        }
        
      });
      
      var DerivedClass= Class.create(BaseClass, {
      
        constructor: function()
        {
        }
        
      });
    
      var c= new DerivedClass();
      expect(baseCalled).toEqual(true);
    });
    
    it("inherits base class constructor if it doesn't provide one", function() {

      var baseCalled= false;
      
      var BaseClass= Class.create({

        constructor: function()
        {
          baseCalled= true;
        }
        
      });
      
      var DerivedClass= Class.create(BaseClass, {
      });
    
      var c= new DerivedClass();
      expect(baseCalled).toEqual(true);
      
    });

    it("can pass arguments to base constructor", function() {
    
      var baseArgumentValue;
      var valueToSendToBaseConstructor= 5;
      
      var BaseClass= Class.create({

        constructor: function(arg)
        {
          baseArgumentValue= arg;
        }
        
      });
      
      var DerivedClass= Class.create(BaseClass, {
      
        constructor: function()
        {
          this.base(valueToSendToBaseConstructor);
        }
        
      });
    
      var c= new DerivedClass();
      expect(baseArgumentValue).toEqual(valueToSendToBaseConstructor);
    });
    
  });
  
});

