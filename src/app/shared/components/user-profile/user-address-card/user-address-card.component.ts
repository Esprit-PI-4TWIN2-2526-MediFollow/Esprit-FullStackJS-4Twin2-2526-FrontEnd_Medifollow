import { Component } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-address-card',
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent {

  constructor(public modal: ModalService) {}

  isOpen = false;
  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  address = {
    country: 'United States.',
    cityState: 'Phoenix, Arizona, United States.',
    postalCode: 'ERT 2489',
    taxId: 'AS4568384',
  };

  handleSave() {
    // Handle save logic here
    console.log('Saving changes...');
    this.modal.closeModal();
  }
}
