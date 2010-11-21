describe("Model support for JSON", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
  });
  
  it("should serialise to JSON", function() {
    var M= Model("Foo", {
            name: String,
            age: Number
          });
          
    var m= new M();
    m.setName("Zebra Pants");
    m.setAge(100);
    var json= JSON.parse(JSON.stringify(m));
    expect(json).toHaveProperty('name');
    expect(json.name).toBe("Zebra Pants");
    expect(json).toHaveProperty('age');
    expect(json.age).toBe(100);
  });
});