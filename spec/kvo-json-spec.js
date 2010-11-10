beforeEach(function() {
  var objectToString= Object.prototype.toString;
  
  this.addMatchers({
    toHaveProperty: function(prop)
    {
      return prop in this.actual;
    },
    toBeOfType: function(type)
    {
      console.log('actual=', objectToString.call(this.actual));
      console.log('type=', objectToString.call(type.prototype));
      return objectToString.call(this.actual) === objectToString.call(type.prototype);
    }
  });
});

describe("KVO", function() {

  it("can serialise to JSON", function() {

    var kvo= new coherent.KVO();
    kvo.setValueForKey("bar", "foo");
    kvo.setValueForKey([1,2,3], "items");
    
    var json= JSON.parse(JSON.stringify(kvo));
    expect(json).toHaveProperty("foo");
    expect(json.foo).toBeOfType(String);
    expect(json).toHaveProperty("items");
    expect(json.items).toBeOfType(Array);
  });

  describe("adapted from a regular object", function() {
  
    it("can serialise to to JSON", function() {
      
      var kvo= coherent.KVO.adapt({
        foo: "bar",
        items: [1,2,3]
      });
      
      var json= JSON.parse(JSON.stringify(kvo));
      console.log(json);
      expect(json).toHaveProperty("foo");
      expect(json.foo).toBeOfType(String);
      expect(json).toHaveProperty("items");
      expect(json.items).toBeOfType(Array);
      
    });
    
  });

  describe("adapted from a tree of objects", function() {
  
    it("can serialise to to JSON", function() {
      
      var kvo= coherent.KVO.adaptTree({
        foo: "bar",
        items: [1,2,3]
      });

      var json= JSON.parse(JSON.stringify(kvo));
      console.log(json);
      expect(json).toHaveProperty("foo");
      expect(json.foo).toBeOfType(String);
      expect(json).toHaveProperty("items");
      expect(json.items).toBeOfType(Array);
      
    });
    
  });

});

