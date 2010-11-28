describe("Model ToMany relations", function() {

  beforeEach(function(){
    coherent.Model._resetModels();

    this.Person= Model("Person", {
      cars: Model.ToMany({
              type: "Car",
              inverse: "owner"
            })
    });
    
    this.Car= Model("Car", {
      owner: Model.ToOne({
              type: "Person",
              inverse: "cars"
            })
    });
    
  });
  
  it("setting to-one inverse adds to to-many relation", function() {
    var P= new this.Person();
    var C1= new this.Car();
    var C2= new this.Car();
    
    C1.setOwner(P);
    expect(P.cars()).toContain(C1);
  });
  
  it("should set to-one value when adding to collection", function() {
    var P= new this.Person();
    var C1= new this.Car();

    P.cars().addObject(C1);
    expect(C1.owner()).toBe(P);
  });

  it("should unset previous object relation when replacing an object in a collection", function() {
    var P= new this.Person();
    var C1= new this.Car();
    var C2= new this.Car();
    
    P.cars().addObject(C1);
    P.cars().replaceObjectAtIndexWithObject(0, C2);
    expect(C1.owner()).toBeNull();
    expect(C2.owner()).toBe(P);
  });
  
  it("should unset owner relation when removing from cars collection", function() {
    var P= new this.Person();
    var C1= new this.Car();

    P.cars().addObject(C1);
    expect(C1.owner()).toBe(P);
    P.cars().removeObject(C1);
    expect(C1.owner()).toBeNull();
  });
  
});