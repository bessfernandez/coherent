describe("Model ToOne relations", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
    
    this.M1= Model("Model1", {
      m2: Model.ToOne({
            type: "Model2",
            inverse: "m1"
          })
    });
    
    this.M2= Model("Model2", {
      m1: Model.ToOne({
            type: "Model1",
            inverse: "m2"
          })
    });


  });

  it("should set inverse relation via setValueForKey", function() {
    var m1= new this.M1();
    var m2= new this.M2();

    m1.setValueForKey(m2, 'm2');
    expect(m2.m1()).toBe(m1);
  });

  it("should set inverse relation via set method", function() {
    var m1= new this.M1();
    var m2= new this.M2();

    m1.setM2(m2);
    expect(m2.m1()).toBe(m1);
  });

  it("should clear previous inverse relation when setting new value", function() {
    var m1= new this.M1();
    var m2= new this.M2();
    var m2a= new this.M2();
    
    debugger;
    m1.setM2(m2);
    expect(m2.m1()).toBe(m1);
    
    m1.setM2(m2a);
    expect(m2.m1()).toBeNull();
    expect(m2a.m1()).toBe(m1);
  });

});