
import { Component } from '@angular/core';

@Component({
  selector: 'app-file-input-example',
  template: `
   <app-component-card title="File Input">
    <div>
      <app-label>Upload file</app-label>
      <app-file-input (change)="handleFileChange($event)" className="custom-class"></app-file-input>
    </div>
  </app-component-card>
  `,
})
export class FileInputExampleComponent {
  handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  }
}