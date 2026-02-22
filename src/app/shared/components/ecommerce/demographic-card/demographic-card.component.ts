import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-demographic-card',
  templateUrl: './demographic-card.component.html',
})
export class DemographicCardComponent {
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  countries = [
    {
      img: '/images/country/country-01.svg',
      alt: 'usa',
      name: 'USA',
      customers: '2,379 Customers',
      percent: 79,
    },
    {
      img: '/images/country/country-02.svg',
      alt: 'france',
      name: 'France',
      customers: '589 Customers',
      percent: 23,
    },
  ];
}
