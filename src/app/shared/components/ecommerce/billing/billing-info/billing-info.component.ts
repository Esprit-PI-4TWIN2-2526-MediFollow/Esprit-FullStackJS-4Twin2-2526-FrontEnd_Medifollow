import { Component } from '@angular/core';

@Component({
  selector: 'app-billing-info',
  templateUrl: './billing-info.component.html',
  host: {
    class: 'rounded-2xl border border-gray-200 bg-white xl:w-2/6 dark:border-gray-800 dark:bg-white/[0.03]',
  },
})
export class BillingInfoComponent {

  isOpen = false;

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
  }

  handleSave ()  {
    // Handle save logic here
    console.log("Saving changes...");
    this.closeModal();
  };
}
