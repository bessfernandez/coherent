describe("Model ToMany relations", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
  });
  
  it("setting to-one inverse adds to to-many relation", function() {
  
    var Person= Model("Person", {
      cars: Model.ToMany({
              type: "Car",
              inverse: "owner"
            })
    });
    
    var Car= Model("Car", {
      owner: Model.ToOne({
              type: "Person",
              inverse: "cars"
            })
    });
    
    var P= new Person();
    var C1= new Car();
    var C2= new Car();
    
    C1.setOwner(P);
    expect(P.cars()).toContain(C1);
    
  });
});