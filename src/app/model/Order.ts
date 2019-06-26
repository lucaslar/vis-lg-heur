export class Order {
  // TODO: Make private and add types

  id;
  name;
  machineOrder;
  timesOnMachines;

  constructor(_name) {
    this.name = _name;
  }

  copy(): Order {
    const copy: Order = <Order>JSON.parse(JSON.stringify(this));

    copy.timesOnMachines = new Map<number, number>();
    for (const i of this.timesOnMachines.keys()) {
      copy.timesOnMachines.set(i, this.timesOnMachines.get(i));
    }

    return copy;
  }

}
