
import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-checkbox-components',
  templateUrl: './checkbox-components.component.html',
  styles: ``
})
export class CheckboxComponentsComponent {

  isChecked = false;
  isCheckedTwo = true;
  isCheckedDisabled = false;
}
