import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-header',
  template: `
    <thead [ngClass]="className"><ng-content></ng-content></thead>
  `,
  styles: ``
})
export class TableHeaderComponent {
  @Input() className = '';
}
