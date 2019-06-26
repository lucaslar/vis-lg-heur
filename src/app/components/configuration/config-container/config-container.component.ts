import {Component, ViewChildren} from '@angular/core';
import {Order} from '../../../model/Order';
import {OrderComponent} from '../order/order.component';

@Component({
  selector: 'app-config-container',
  templateUrl: './config-container.component.html',
  styleUrls: ['./config-container.component.css']
})
export class ConfigContainerComponent {

  nrOfMachines = 1;
  orderNameInput: string;
  orders: Order[] = [];

  @ViewChildren('orderComponent') orderComponents: OrderComponent[];

  deleteOrder(order: Order): void {
    this.orders = this.orders.filter(o => o !== order);

    let i = 0;
    this.orders.forEach(o => {
      if (o.id !== ++i) {
        o.id = i;
      }
    });
  }

  copyOrder(order: Order): void {
    this.addOrder(order.copy());
  }

  createNewOrder(): void {
    const order = new Order(this.orderNameInput);
    this.generateRandomOrderData(order);
    this.addOrder(order);
  }

  addOrder(order): void {
    order.id = this.orders.length + 1;
    this.orders.push(order);
  }

  private generateRandomOrderData(order: Order): void {
    order.machineOrder = [];
    order.timesOnMachines = new Map<number, number>();
    for (let i = 1; i <= this.nrOfMachines; i++) {
      order.machineOrder.push(i);
      order.timesOnMachines.set(i, Math.floor(Math.random() * (40 - 10)) + 10);
    }
  }

  onMachineNrChange(): void {
    this.orderComponents.forEach(component => component.closePanel());
    this.orders.forEach(order => {
      if (order.machineOrder.length > this.nrOfMachines) {
        order.machineOrder = order.machineOrder.filter(
          machineNr => machineNr <= this.nrOfMachines
        );
      } else if (order.machineOrder.length < this.nrOfMachines) {
        for (let i = order.machineOrder.length + 1; i <= this.nrOfMachines; i++) {
          order.machineOrder.push(i);
          order.timesOnMachines.set(i, Math.floor(Math.random() * (40 - 10)) + 10);
        }
      }
    });
  }

}
