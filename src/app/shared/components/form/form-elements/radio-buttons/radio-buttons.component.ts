import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-radio-buttons',
  templateUrl: './radio-buttons.component.html',
  styles: ``
})
export class RadioButtonsComponent {

  selectedValue: string = 'option2';

  handleRadioChange(value: string) {
    console.log(value,'value')
    this.selectedValue = value;
  }
}
